import { getAddresses } from './addresses';
import type { SponsorEdge, FeeLeg, FeeSplit } from './affiliate';
import { paidLegs, DEFAULT_FEE_SPLIT } from './affiliate';

/**
 * Vault subgraph (The Graph) reads. The subgraph indexes events into entities, so it's the fast
 * path for HISTORICAL series (POL growth), AGGREGATES (protocol totals), and the AFFILIATE graph
 * (leaderboard) — things that otherwise need slow multi-call RPC log scans.
 *
 * NOT used for live, block-by-block values (claimable KMT, live mark-to-market POL value): those
 * are computed from the current block/pool state and stay on RPC (the subgraph snapshots lag).
 */
export const SUBGRAPH_URL =
	process.env.NEXT_PUBLIC_VAULT_SUBGRAPH_URL || 'https://app.kalyswap.io/subgraphs/name/vault-subgraph-kmt';

// The DEX (Uniswap-V3) subgraph — separate deployment. Source of whole-pool TVL + the KMT price
// (WKMT is the base token, so its derivedETH = 1 and KMT price = bundle.ethPriceUSD).
export const V3_SUBGRAPH_URL =
	process.env.NEXT_PUBLIC_V3_SUBGRAPH_URL || 'https://app.kalyswap.io/subgraphs/name/v3-subgraph-kmt';

const A = getAddresses();
// stable address (lowercase) -> decimals, to value `paid`/amounts the subgraph stores in raw units.
const STABLE_DECIMALS: Record<string, number> = {};
for (const s of Object.values(A.stables)) STABLE_DECIMALS[s.address.toLowerCase()] = s.decimals;
const decimalsFor = (addr: string) => STABLE_DECIMALS[addr?.toLowerCase()] ?? 18;
// The KMT/stable V3 pools backing the vaults (lowercased for id_in filters).
const VAULT_POOL_IDS = Object.values(A.stables)
	.map((s) => s.pool?.toLowerCase())
	.filter(Boolean) as string[];

async function gql<T>(query: string, variables?: Record<string, unknown>, url: string = SUBGRAPH_URL): Promise<T> {
	if (!url) throw new Error('no subgraph url');
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query, variables }),
	});
	const json = await res.json();
	if (json.errors) throw new Error('subgraph: ' + JSON.stringify(json.errors));
	return json.data as T;
}

// Which side of a pool is the wrapped native token — by ADDRESS, never by symbol (the symbol
// regex this replaced matched "WKLC" and silently mislabelled every pool after the rename).
const WRAPPED_NATIVE = A.wrappedNative.toLowerCase();
const isWrappedNative = (tokenId: string) => tokenId.toLowerCase() === WRAPPED_NATIVE;

export interface PoolTvl { totalUsd: number; perPool: { symbol: string; usd: number }[]; klcUsd: number }

/**
 * Whole-pool TVL of the KMT/stable vault pools (everyone's liquidity) + the live KMT price, from
 * the V3 subgraph. This is the TOTAL pool depth — distinct from protocol-OWNED liquidity (the DAO's
 * own positions, valued on-chain in usePolStats). Shown as a separate "Total Pool Liquidity" stat.
 */
export async function fetchPoolTvl(): Promise<PoolTvl | null> {
	if (VAULT_POOL_IDS.length === 0) return null;
	const data = await gql<{
		pools: { token0: { id: string; symbol: string }; token1: { id: string; symbol: string }; totalValueLockedUSD: string }[];
		bundles: { ethPriceUSD: string }[];
	}>(
		`query PoolTvl($ids: [Bytes!]!) {
			pools(where: { id_in: $ids }) { token0 { id symbol } token1 { id symbol } totalValueLockedUSD }
			bundles(first: 1) { ethPriceUSD }
		}`,
		{ ids: VAULT_POOL_IDS },
		V3_SUBGRAPH_URL,
	);
	const perPool = data.pools.map((p) => ({
		symbol: isWrappedNative(p.token0.id) ? p.token1.symbol : p.token0.symbol,
		usd: Number(p.totalValueLockedUSD),
	}));
	const totalUsd = perPool.reduce((s, p) => s + p.usd, 0);
	const klcUsd = Number(data.bundles[0]?.ethPriceUSD ?? 0); // WKMT.derivedETH = 1 → KMT = ethPriceUSD
	return { totalUsd, perPool, klcUsd };
}

/** Live KMT price from the V3 subgraph (bundle.ethPriceUSD). null if unavailable. */
export async function fetchKlcPriceV3(): Promise<number | null> {
	const data = await gql<{ bundles: { ethPriceUSD: string }[] }>(
		`{ bundles(first: 1) { ethPriceUSD } }`,
		undefined,
		V3_SUBGRAPH_URL,
	);
	const p = Number(data.bundles[0]?.ethPriceUSD);
	return p > 0 ? p : null;
}

export interface PolPoint { t: number; usd: number }

/**
 * Cumulative protocol-owned-liquidity ADDED over time (USD at deposit), built from each vault's
 * 80% POL allocation. This is the deposit-time growth trend (distinct from the live mark-to-market
 * POL value shown as the headline). One query, paginated, cheap.
 */
export async function fetchPolHistory(): Promise<PolPoint[]> {
	const data = await gql<{ vaults: { paid: string; stable: string; createdAtTimestamp: string }[] }>(
		`query PolHistory($first: Int!) {
			vaults(first: $first, orderBy: createdAtTimestamp, orderDirection: asc) {
				paid stable createdAtTimestamp
			}
		}`,
		{ first: 1000 },
	);
	let cum = 0;
	return data.vaults.map((v) => {
		const usd = Number(v.paid) / 10 ** decimalsFor(v.stable);
		cum += usd * 0.8; // 80% of every purchase becomes POL
		return { t: Number(v.createdAtTimestamp), usd: Math.round(cum * 100) / 100 };
	});
}

/**
 * Affiliate graph (sponsor edges + commission legs) from the subgraph, in the SAME shape the RPC
 * scan produced — so the existing pure `affiliateStats()` / `leaderboard()` functions consume it
 * unchanged (downline walk, by-level totals, rank, loyalty, activity).
 *
 * IMPORTANT: the subgraph stores commission amounts in RAW stable units and its pre-aggregated
 * `totalCommissionEarned` mixes 6- and 18-dec sums — unusable for USD. We instead value each
 * commission leg here with the stable's real decimals (decimalsFor), matching the on-chain path.
 */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export async function fetchAffiliateGraph(split: FeeSplit = DEFAULT_FEE_SPLIT): Promise<{ edges: SponsorEdge[]; legs: FeeLeg[]; head: bigint }> {
	// buyer/level1/2/3 are Account ENTITY REFERENCES — they MUST be queried with a selection
	// set ({ address }). Queried as scalars, graph-node silently OMITS them from the response
	// (no error), which nulled every commission leg and made the leaderboard show $0.00.
	const data = await gql<{
		_meta: { block: { number: number; timestamp: number } };
		accounts: { address: string; sponsor: { address: string } | null }[];
		commissions: {
			buyer: { address: string }; stable: string;
			level1: { address: string } | null; level2: { address: string } | null; level3: { address: string } | null;
			amount1: string; amount2: string; amount3: string; devAmount: string; daoAmount: string; timestamp: string;
		}[];
	}>(
		`query AffiliateGraph($first: Int!) {
			_meta { block { number timestamp } }
			accounts(first: $first) { address sponsor { address } }
			commissions(first: $first, orderBy: timestamp, orderDirection: asc) {
				buyer { address } stable
				level1 { address } level2 { address } level3 { address }
				amount1 amount2 amount3 devAmount daoAmount timestamp
			}
		}`,
		{ first: 1000 },
	);

	const head = BigInt(data._meta.block.number);
	const headTs = data._meta.block.timestamp;
	// Commission entities expose timestamp, not block; loyalty/activity need a block. KalyChain is
	// ~2s/block, so approximate from the head block + its timestamp (good enough for tenure buckets).
	const tsToBlock = (ts: number) => head - BigInt(Math.max(0, Math.floor((headTs - ts) / 2)));

	const edges: SponsorEdge[] = data.accounts
		.filter((a) => a.sponsor)
		.map((a) => ({ buyer: a.address.toLowerCase(), sponsor: a.sponsor!.address.toLowerCase() }));

	const legs: FeeLeg[] = [];
	for (const c of data.commissions) {
		const dec = decimalsFor(c.stable);
		const block = tsToBlock(Number(c.timestamp));
		// amount1/2/3 are stored even when that level was NOT paid: an unqualified sponsor (holds no
		// vault) is recorded with its real address while the money went to the DAO. A present address
		// is therefore NOT proof of payment — reconcile against daoAmount to find the paid legs.
		const amounts: [bigint, bigint, bigint] = [BigInt(c.amount1), BigInt(c.amount2), BigInt(c.amount3)];
		const paid = paidLegs(amounts, BigInt(c.devAmount), BigInt(c.daoAmount), split) ?? [true, true, true];
		const tiers: [string | undefined, 1 | 2 | 3][] = [
			[c.level1?.address, 1],
			[c.level2?.address, 2],
			[c.level3?.address, 3],
		];
		for (const [addr, level] of tiers) {
			const amt = amounts[level - 1];
			if (paid[level - 1] && addr && addr.toLowerCase() !== ZERO_ADDR && amt > 0n) {
				legs.push({ affiliate: addr.toLowerCase(), level, usd: Number(amt) / 10 ** dec, buyer: c.buyer.address.toLowerCase(), block });
			}
		}
	}
	return { edges, legs, head };
}

