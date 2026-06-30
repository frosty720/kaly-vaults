import { ACTIVE_NETWORK } from './chains';
import { getAddresses } from './addresses';
import type { NetworkName } from './chains';
import type { SponsorEdge, FeeLeg } from './affiliate';

/**
 * Vault subgraph (The Graph) reads. The subgraph indexes events into entities, so it's the fast
 * path for HISTORICAL series (POL growth), AGGREGATES (protocol totals), and the AFFILIATE graph
 * (leaderboard) — things that otherwise need slow multi-call RPC log scans.
 *
 * NOT used for live, block-by-block values (claimable KLC, live mark-to-market POL value): those
 * are computed from the current block/pool state and stay on RPC (the subgraph snapshots lag).
 */
const SUBGRAPH_URLS: Record<NetworkName, string> = {
	mainnet: 'https://app.kalyswap.io/subgraphs/name/vault-subgraph-kalychain-mainnet',
	testnet: '', // no testnet subgraph deployed — callers fall back to empty/RPC
};

// The DEX (Uniswap-V3) subgraph — separate deployment. Source of whole-pool TVL + the KLC price
// (WKLC is the base token, so its derivedETH = 1 and KLC price = bundle.ethPriceUSD).
const V3_SUBGRAPH_URLS: Record<NetworkName, string> = {
	mainnet: 'https://app.kalyswap.io/subgraphs/name/v3-subgraph-kalychain-mainnet',
	testnet: '',
};

export const SUBGRAPH_URL = SUBGRAPH_URLS[ACTIVE_NETWORK];
export const hasSubgraph = SUBGRAPH_URL !== '';
export const V3_SUBGRAPH_URL = V3_SUBGRAPH_URLS[ACTIVE_NETWORK];
export const hasV3Subgraph = V3_SUBGRAPH_URL !== '';

const A = getAddresses(ACTIVE_NETWORK);
// stable address (lowercase) -> decimals, to value `paid`/amounts the subgraph stores in raw units.
const STABLE_DECIMALS: Record<string, number> = {};
for (const s of Object.values(A.stables)) STABLE_DECIMALS[s.address.toLowerCase()] = s.decimals;
const decimalsFor = (addr: string) => STABLE_DECIMALS[addr?.toLowerCase()] ?? 18;
// The KLC/stable V3 pools backing the vaults (lowercased for id_in filters).
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

const isKlcSymbol = (s: string) => /^w?klc$/i.test(s);

export interface PoolTvl { totalUsd: number; perPool: { symbol: string; usd: number }[]; klcUsd: number }

/**
 * Whole-pool TVL of the KLC/stable vault pools (everyone's liquidity) + the live KLC price, from
 * the V3 subgraph. This is the TOTAL pool depth — distinct from protocol-OWNED liquidity (the DAO's
 * own positions, valued on-chain in usePolStats). Shown as a separate "Total Pool Liquidity" stat.
 */
export async function fetchPoolTvl(): Promise<PoolTvl | null> {
	if (!hasV3Subgraph || VAULT_POOL_IDS.length === 0) return null;
	const data = await gql<{
		pools: { token0: { symbol: string }; token1: { symbol: string }; totalValueLockedUSD: string }[];
		bundles: { ethPriceUSD: string }[];
	}>(
		`query PoolTvl($ids: [ID!]!) {
			pools(where: { id_in: $ids }) { token0 { symbol } token1 { symbol } totalValueLockedUSD }
			bundles(first: 1) { ethPriceUSD }
		}`,
		{ ids: VAULT_POOL_IDS },
		V3_SUBGRAPH_URL,
	);
	const perPool = data.pools.map((p) => ({
		symbol: isKlcSymbol(p.token0.symbol) ? p.token1.symbol : p.token0.symbol,
		usd: Number(p.totalValueLockedUSD),
	}));
	const totalUsd = perPool.reduce((s, p) => s + p.usd, 0);
	const klcUsd = Number(data.bundles[0]?.ethPriceUSD ?? 0); // WKLC.derivedETH = 1 → KLC = ethPriceUSD
	return { totalUsd, perPool, klcUsd };
}

/** Live KLC price from the V3 subgraph (bundle.ethPriceUSD). null if unavailable. */
export async function fetchKlcPriceV3(): Promise<number | null> {
	if (!hasV3Subgraph) return null;
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
	if (!hasSubgraph) return [];
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

export async function fetchAffiliateGraph(): Promise<{ edges: SponsorEdge[]; legs: FeeLeg[]; head: bigint }> {
	if (!hasSubgraph) return { edges: [], legs: [], head: 0n };
	const data = await gql<{
		_meta: { block: { number: number; timestamp: number } };
		accounts: { address: string; sponsor: { address: string } | null }[];
		commissions: {
			buyer: string; stable: string;
			level1: string; level2: string; level3: string;
			amount1: string; amount2: string; amount3: string; timestamp: string;
		}[];
	}>(
		`query AffiliateGraph($first: Int!) {
			_meta { block { number timestamp } }
			accounts(first: $first) { address sponsor { address } }
			commissions(first: $first, orderBy: timestamp, orderDirection: asc) {
				buyer stable level1 level2 level3 amount1 amount2 amount3 timestamp
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
		const tiers: [string, string, 1 | 2 | 3][] = [
			[c.level1, c.amount1, 1],
			[c.level2, c.amount2, 2],
			[c.level3, c.amount3, 3],
		];
		for (const [addr, amt, level] of tiers) {
			if (addr && addr.toLowerCase() !== ZERO_ADDR && Number(amt) > 0) {
				legs.push({ affiliate: addr.toLowerCase(), level, usd: Number(amt) / 10 ** dec, buyer: c.buyer.toLowerCase(), block });
			}
		}
	}
	return { edges, legs, head };
}

export interface ProtocolTotals { vaultsMinted: number; totalDepositedUsd: number }

/** Protocol-wide aggregates: vault count from the singleton, deposited-USD summed from vaults. */
export async function fetchProtocolTotals(): Promise<ProtocolTotals> {
	if (!hasSubgraph) return { vaultsMinted: 0, totalDepositedUsd: 0 };
	const data = await gql<{
		protocol: { totalVaultsSold: string } | null;
		vaults: { paid: string; stable: string }[];
	}>(
		`query Totals {
			protocol(id: "1") { totalVaultsSold }
			vaults(first: 1000) { paid stable }
		}`,
	);
	const totalDepositedUsd = data.vaults.reduce((sum, v) => sum + Number(v.paid) / 10 ** decimalsFor(v.stable), 0);
	return { vaultsMinted: Number(data.protocol?.totalVaultsSold ?? data.vaults.length), totalDepositedUsd };
}
