'use client';
import type { PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { getAddresses } from './addresses';
import { ACTIVE_NETWORK } from './chains';
import { rewardsPoolAbi, vaultManagerAbi, positionManagerAbi, v3PoolAbi } from './abis';
import { getOwnedVaultTokenIds, getPurchases, getTreasuryPositionIds } from './events';
import { klcUsdFromSlot0, positionTokenAmounts, positionUsdValue } from './pol';
import { getAffiliateEvents, affiliateStats, leaderboard } from './affiliate';
import { getKlcPrice, isValidKlcPrice } from '@/lib/price';

const A = getAddresses(ACTIVE_NETWORK);

/** Shared scan of SponsorSet + FeesRouted events; both affiliate hooks derive from this. */
function useAffiliateEvents() {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['affiliateEvents', ACTIVE_NETWORK],
		enabled: !!client && !!A.vaultManager,
		refetchInterval: 30000,
		queryFn: () => getAffiliateEvents(client!, A.vaultManager!, A.deployBlock),
	});
}

/** Per-address affiliate stats: direct referrals, downline size, commission earned by level. */
export function useAffiliate(addr?: `0x${string}`) {
	const ev = useAffiliateEvents();
	const data = ev.data && addr ? affiliateStats(addr, ev.data.edges, ev.data.legs, ev.data.head) : undefined;
	return { data, isLoading: ev.isLoading, isError: ev.isError };
}

/** Top affiliates by commission, then referral count. */
export function useLeaderboard() {
	const ev = useAffiliateEvents();
	const data = ev.data ? leaderboard(ev.data.edges, ev.data.legs) : undefined;
	return { data, isLoading: ev.isLoading, isError: ev.isError };
}

/** This address's sponsor (upline), read straight from the contract. */
export function useSponsor(addr?: `0x${string}`) {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['sponsor', addr, ACTIVE_NETWORK],
		enabled: !!client && !!A.vaultManager && !!addr,
		queryFn: async () => {
			const s = await client!.readContract({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'sponsorOf', args: [addr!] }) as string;
			return s === '0x0000000000000000000000000000000000000000' ? null : s;
		},
	});
}

/**
 * Live USD-per-KLC straight from the chain's own anchor stable pool (slot0 spot).
 * We use the VaultManager's `priceAnchorStable` to pick the canonical pool — the same
 * stable the contract anchors its maturity oracle to — so the dApp's headline price and
 * the protocol's internal price reference the same pool. Returns null on any failure so
 * the caller can fall back to the off-chain market price.
 */
async function klcUsdFromAnchorPool(client: PublicClient): Promise<number | null> {
	if (!A.vaultManager || !A.wklc) return null;
	const stables = Object.values(A.stables);
	if (stables.length === 0) return null;

	// Which stable does the contract anchor to? Fall back to the first configured stable
	// if the contract predates priceAnchorStable or returns an address we don't track.
	let anchor: string | null = null;
	try {
		anchor = (await client.readContract({
			address: A.vaultManager, abi: vaultManagerAbi, functionName: 'priceAnchorStable',
		}) as string).toLowerCase();
	} catch {
		anchor = null;
	}
	const stable = (anchor && stables.find((s) => s.address.toLowerCase() === anchor)) || stables[0];

	const [slot0, token0] = await Promise.all([
		client.readContract({ address: stable.pool, abi: v3PoolAbi, functionName: 'slot0' }),
		client.readContract({ address: stable.pool, abi: v3PoolAbi, functionName: 'token0' }),
	]);
	const stableIsToken0 = (token0 as string).toLowerCase() === stable.address.toLowerCase();
	const price = klcUsdFromSlot0({
		sqrtPriceX96: slot0[0] as bigint,
		stableIsToken0,
		stableDecimals: stable.decimals,
	});
	return isValidKlcPrice(price) ? price : null;
}

/**
 * KLC/USD for the dApp. Prefers the live on-chain spot from the anchor stable pool so the
 * user always sees the real price *on the network they're connected to* (testnet shows the
 * testnet pool, mainnet shows the mainnet pool). Falls back to the off-chain market price
 * (DEX → CoinGecko) only when the pool can't be read.
 */
export function useKlcPrice() {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['klcPrice', ACTIVE_NETWORK],
		refetchInterval: 60000,
		queryFn: async () => {
			if (client) {
				try {
					const onchain = await klcUsdFromAnchorPool(client as unknown as PublicClient);
					if (onchain !== null) return onchain;
				} catch {
					// fall through to the off-chain market price
				}
			}
			return getKlcPrice();
		},
	});
}

export interface VaultData {
	id: bigint;
	tier: number;
	weight: bigint;
	earnedKlc: bigint;
	earnedUsd: bigint;
	capUsd: bigint;
	matured: boolean;
	/** 0–100+ as a two-decimal float; 0 if capUsd is zero */
	maturityPct: number;
}

export function useVaults(addr?: `0x${string}`) {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['vaults', addr, ACTIVE_NETWORK],
		enabled: !!addr && !!client && !!A.vaultManager,
		queryFn: async () => {
			const ids = await getOwnedVaultTokenIds(client!, A.vaultManager!, addr!, A.deployBlock);
			// Live USD-per-KLC straight from the contract (same price it uses to settle maturity),
			// so the maturity bar reflects what's actually been earned rather than the last-checkpointed
			// value (which only updates on claim, leaving an unclaimed-but-capped vault showing 0%).
			const klcUsd = await client!.readContract({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'klcUsdPrice' }) as bigint;
			const out: VaultData[] = [];
			for (const id of ids) {
				const owner = await client!.readContract({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'ownerOf', args: [id] });
				if ((owner as string).toLowerCase() !== addr!.toLowerCase()) continue;
				const tier = await client!.readContract({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'tierOf', args: [id] });
				// Weight comes from the tier config (tiers[tier].weight) rather than the per-token
				// vaultWeight mapping — safer for cross-version compat.
				const t = await client!.readContract({ address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'tiers', args: [BigInt(Number(tier))] });

				// Per-vault reward data from v2 RewardsPool
				const earnedKlc = A.rewardsPool
					? await client!.readContract({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'earned', args: [id] }) as bigint
					: 0n;
				const earnedUsd = A.rewardsPool
					? await client!.readContract({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'earnedUsdOf', args: [id] }) as bigint
					: 0n;
				const capUsd = A.rewardsPool
					? await client!.readContract({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'capUsdOf', args: [id] }) as bigint
					: 0n;
				const matured = A.rewardsPool
					? await client!.readContract({ address: A.rewardsPool!, abi: rewardsPoolAbi, functionName: 'isMatured', args: [id] }) as boolean
					: false;

				// Live earned-USD toward the cap = checkpointed earnedUsd + the live unclaimed KLC valued
				// at the contract's klcUsdPrice. `earned()` already caps the KLC at the remaining USD, so
				// this never overshoots the cap. Clamp defensively anyway.
				let liveEarnedUsd = earnedUsd + (earnedKlc * klcUsd) / 10n ** 18n;
				if (capUsd > 0n && liveEarnedUsd > capUsd) liveEarnedUsd = capUsd;
				const maturityPct = capUsd > 0n ? Number(liveEarnedUsd * 10000n / capUsd) / 100 : 0;
				// A vault that has earned its full cap is effectively matured even before the on-chain
				// `matured` flag flips (it only flips on the next claim/checkpoint).
				const maturedLive = matured || (capUsd > 0n && liveEarnedUsd >= capUsd);

				out.push({ id, tier: Number(tier), weight: t[2] as bigint, earnedKlc, earnedUsd, capUsd, matured: maturedLive, maturityPct });
			}
			return out;
		},
	});
}

/**
 * Returns total claimable KLC (sum of earned(id) across all owned vaults) + the vault ids.
 * The claim button passes these ids to claimMany(ids).
 * This hook re-uses the vaults query result so no extra RPC calls are made.
 */
export function useClaimable(addr?: `0x${string}`) {
	const vaults = useVaults(addr);
	const totalClaimableKlc = vaults.data
		? vaults.data.reduce((sum, v) => sum + v.earnedKlc, 0n)
		: undefined;
	const ids = vaults.data ? vaults.data.map((v) => v.id) : undefined;

	return {
		data: totalClaimableKlc !== undefined ? { totalClaimableKlc, ids: ids ?? [] } : undefined,
		isLoading: vaults.isLoading,
		isError: vaults.isError,
		refetch: vaults.refetch,
	};
}

/**
 * Protocol-wide KPIs derived entirely from on-chain data:
 *  - totalDepositedUsd: Σ of every Purchased.paid (stables valued at $1)
 *  - vaultsMinted:      count of Purchased events
 *  - aprMinPct/aprMaxPct: from each active tier's on-chain aprBps
 * No estimates, no placeholders — empty chain → honest zeros.
 */
export function useProtocolStats() {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['protocolStats', ACTIVE_NETWORK],
		enabled: !!client && !!A.vaultManager,
		refetchInterval: 30000,
		queryFn: async () => {
			const purchases = await getPurchases(client!, A.vaultManager!, A.deployBlock);
			let totalDepositedUsd = 0;
			for (const p of purchases) {
				const stable = Object.values(A.stables).find((s) => s.address.toLowerCase() === p.stable.toLowerCase());
				if (!stable) continue; // unknown stable → skip rather than guess
				totalDepositedUsd += Number(p.paid) / 10 ** stable.decimals;
			}
			// Read active tier APRs straight from the contract (aprBps → %).
			const aprs: number[] = [];
			for (let i = 0; i < 16; i++) {
				try {
					const t = await client!.readContract({
						address: A.vaultManager!, abi: vaultManagerAbi, functionName: 'tiers', args: [BigInt(i)],
					});
					// [0]=priceUSD [1]=aprBps [2]=weight [3]=metadataURI [4]=active
					if (t[4]) aprs.push(Number(t[1]) / 100);
				} catch {
					break; // out-of-range read reverts → no more tiers
				}
			}
			return {
				totalDepositedUsd,
				vaultsMinted: purchases.length,
				aprMinPct: aprs.length ? Math.min(...aprs) : 0,
				aprMaxPct: aprs.length ? Math.max(...aprs) : 0,
			};
		},
	});
}

export function usePolStats() {
	const client = usePublicClient();
	return useQuery({
		queryKey: ['polStats', ACTIVE_NETWORK],
		enabled: !!client && !!A.positionManager && !!A.treasury && !!A.wklc,
		// Re-value on-chain POL periodically so transfers/new deployments + live price
		// moves show up without a manual reload. Each position is priced from its OWN
		// pool's slot0, so this re-reads the spot every cycle.
		refetchInterval: 30000,
		queryFn: async () => {
			// --- Live valuation: enumerate ALL positions the treasury owns via ERC721Enumerable ---
			// Each buy minted its own LP NFT, so the treasury holds many positions across the 2
			// KLC/stable pools. They're independent, so value them concurrently (not one-at-a-time)
			// and aggregate per pool afterwards.
			const ids = await getTreasuryPositionIds(client!, A.positionManager!, A.treasury!);
			const wklcAddr = A.wklc!.toLowerCase();

			const valued = await Promise.all(ids.map(async (id) => {
				// positions() returns a named readonly tuple — access by index
				// [0]=nonce [1]=operator [2]=token0 [3]=token1 [4]=fee [5]=tickLower [6]=tickUpper [7]=liquidity
				const pos = await client!.readContract({
					address: A.positionManager!, abi: positionManagerAbi, functionName: 'positions', args: [id],
				});
				const liquidity = pos[7] as bigint;
				if (liquidity === 0n) return null;

				const token0 = (pos[2] as string).toLowerCase();
				const token1 = (pos[3] as string).toLowerCase();

				// Identify the stable: whichever of token0/token1 is NOT WKLC
				const stableIsToken0 = token0 !== wklcAddr;
				const stableAddr = stableIsToken0 ? token0 : token1;

				// Only value KLC/stable pairs — skip anything else
				const stableEntry = Object.entries(A.stables).find(
					([, info]) => info.address.toLowerCase() === stableAddr,
				);
				if (!stableEntry) return null;
				// Also confirm the other side is actually WKLC
				const otherAddr = stableIsToken0 ? token1 : token0;
				if (otherAddr !== wklcAddr) return null;

				const [symbol, stable] = stableEntry;

				// slot0() returns a named readonly tuple — access by index
				// [0]=sqrtPriceX96 [1]=tick ...
				const slot0 = await client!.readContract({ address: stable.pool, abi: v3PoolAbi, functionName: 'slot0' });
				const dec0 = stableIsToken0 ? stable.decimals : 18;
				const dec1 = stableIsToken0 ? 18 : stable.decimals;
				const fee = Number(pos[4]);
				const tickLower = Number(pos[5]);
				const tickUpper = Number(pos[6]);
				const amts = positionTokenAmounts({
					sqrtPriceX96: slot0[0] as bigint,
					tickLower,
					tickUpper,
					liquidity,
					decimals0: dec0,
					decimals1: dec1,
					fee,
				});
				// Mark-to-market: value THIS position's KLC at the live spot of the pool it
				// actually sits in (not a global price). On testnet the thin pools diverge, so
				// per-pool pricing is the honest valuation; on mainnet they converge.
				const klcPriceUsd = klcUsdFromSlot0({
					sqrtPriceX96: slot0[0] as bigint,
					stableIsToken0,
					stableDecimals: stable.decimals,
				});
				const usd = positionUsdValue({
					...amts,
					decimals0: dec0,
					decimals1: dec1,
					stableIsToken0,
					klcPriceUsd,
				});
				return { symbol, usd };
			}));

			let totalUsd = 0;
			const poolSums: Record<string, number> = {};
			for (const v of valued) {
				if (!v) continue;
				totalUsd += v.usd;
				poolSums[v.symbol] = (poolSums[v.symbol] ?? 0) + v.usd;
			}
			const perPool = Object.entries(poolSums).map(([symbol, usd]) => ({ symbol, usd }));

			return { totalUsd, perPool };
		},
	});
}
