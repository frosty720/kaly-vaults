import type { PublicClient } from 'viem';
import { vaultManagerAbi } from './abis';
import { getAddresses } from './addresses';
import { ACTIVE_NETWORK } from './chains';

const A = getAddresses(ACTIVE_NETWORK);
const CHUNK = 50000n;

async function getLogsChunked(
	client: PublicClient,
	params: { address: `0x${string}`; event: any; args?: any; fromBlock: bigint; toBlock: bigint },
) {
	const out: any[] = [];
	for (let from = params.fromBlock; from <= params.toBlock; from += CHUNK + 1n) {
		const to = from + CHUNK > params.toBlock ? params.toBlock : from + CHUNK;
		out.push(...(await client.getLogs({ address: params.address, event: params.event, args: params.args, fromBlock: from, toBlock: to })));
	}
	return out;
}

const lc = (a: string) => a.toLowerCase();
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export interface SponsorEdge { buyer: string; sponsor: string }
/** A commission leg attributed to an affiliate from one purchase. */
export interface FeeLeg { affiliate: string; level: 1 | 2 | 3; usd: number; buyer: string; block: bigint }

const BLOCKS_PER_DAY = 43200n; // KalyChain 2s blocks
const BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30n;

export interface FeeSplit { n1Bps: number; n2Bps: number; n3Bps: number; devBps: number; daoBps: number }

/** VaultManager.initializeV3 defaults — 6% / 2.5% / 1.5% / dev 2% / DAO 8% (POL 80%). */
export const DEFAULT_FEE_SPLIT: FeeSplit = { n1Bps: 600, n2Bps: 250, n3Bps: 150, devBps: 200, daoBps: 800 };

/**
 * Which of the three affiliate legs a `FeesRouted` event ACTUALLY paid out.
 *
 * The event emits n1/n2/n3 and their amounts unconditionally. A level that failed the
 * skin-in-the-game gate (`VaultManager._payLeg` — the recipient must hold >= 1 vault) still
 * appears with its real, non-zero address and its full amount, while the money was transferred
 * to the DAO treasury instead. Only `daoAmt` reflects what really happened:
 *
 *     daoAmt = daoBase + Σ(unpaid legs),  where  daoBase = amount * daoBps / BPS
 *
 * `daoBase` is reconstructed from `devAmt` (both scale the same purchase amount by their bps).
 * The three legs derive from distinct bps, so the subset summing to the excess is unique — that
 * identifies exactly which legs were rolled up to the DAO.
 *
 * Returns `null` when the excess matches no subset or more than one (e.g. `setFeeSplit` changed
 * the ratios after this event was emitted), so callers can fall back rather than silently
 * mis-stating someone's earnings.
 */
export function paidLegs(
	amounts: readonly [bigint, bigint, bigint],
	devAmt: bigint,
	daoAmt: bigint,
	split: FeeSplit = DEFAULT_FEE_SPLIT,
): [boolean, boolean, boolean] | null {
	if (split.devBps === 0) return null; // daoBase not derivable from devAmt
	const daoBase = (devAmt * BigInt(split.daoBps)) / BigInt(split.devBps);
	const excess = daoAmt - daoBase;
	if (excess < 0n) return null;

	const positive = amounts.filter((a) => a > 0n);
	if (positive.length === 0) return [true, true, true]; // nothing was payable either way

	// Distinct subset sums are separated by at least the smallest leg, so anything within half of
	// it is an unambiguous match — this absorbs the few-unit drift from reconstructing daoBase
	// through two floor divisions.
	const tol = positive.reduce((m, a) => (a < m ? a : m)) / 2n;

	let match: number | null = null;
	for (let mask = 0; mask < 8; mask++) {
		let sum = 0n;
		for (let i = 0; i < 3; i++) if ((mask >> i) & 1) sum += amounts[i];
		const diff = sum > excess ? sum - excess : excess - sum;
		if (diff <= tol) {
			if (match !== null) return null; // degenerate amounts — refuse to guess
			match = mask;
		}
	}
	if (match === null) return null;
	// a set bit means that leg rolled to the DAO, i.e. was NOT paid
	return [(match & 1) === 0, ((match >> 1) & 1) === 0, ((match >> 2) & 1) === 0];
}

/** Raw SponsorSet + FeesRouted events for the VaultManager, decoded into a usable shape. */
export async function getAffiliateEvents(
	client: PublicClient, vaultManager: `0x${string}`, fromBlock: bigint, split: FeeSplit = DEFAULT_FEE_SPLIT,
): Promise<{ edges: SponsorEdge[]; legs: FeeLeg[]; head: bigint }> {
	const ssEvent = vaultManagerAbi.find((x: any) => x.type === 'event' && x.name === 'SponsorSet');
	const frEvent = vaultManagerAbi.find((x: any) => x.type === 'event' && x.name === 'FeesRouted');
	const head = await client.getBlockNumber();

	const ssLogs = await getLogsChunked(client, { address: vaultManager, event: ssEvent, fromBlock, toBlock: head });
	const edges: SponsorEdge[] = ssLogs.map((l) => ({ buyer: lc(l.args.buyer), sponsor: lc(l.args.sponsor) }));

	// Stable -> $1 (decimals matter for the amount). Build a decimals lookup for valuation.
	const dec: Record<string, number> = {};
	for (const s of Object.values(A.stables)) dec[lc(s.address)] = s.decimals;

	const frLogs = await getLogsChunked(client, { address: vaultManager, event: frEvent, fromBlock, toBlock: head });
	const legs: FeeLeg[] = [];
	for (const l of frLogs) {
		const d = dec[lc(l.args.stable)] ?? 18;
		const usd = (amt: bigint) => Number(amt) / 10 ** d;
		const buyer = lc(l.args.buyer);
		const blk = l.blockNumber as bigint;
		const amounts: [bigint, bigint, bigint] = [l.args.n1Amt, l.args.n2Amt, l.args.n3Amt];
		// A non-zero level address does NOT mean that level was paid — an unqualified sponsor is
		// still named in the event while its money went to the DAO. Reconcile against daoAmt.
		const paid = paidLegs(amounts, l.args.devAmt, l.args.daoAmt, split) ?? [true, true, true];
		const addrs = [l.args.n1, l.args.n2, l.args.n3];
		for (let i = 0; i < 3; i++) {
			if (!paid[i] || addrs[i] === ZERO_ADDRESS || amounts[i] === 0n) continue;
			legs.push({ affiliate: lc(addrs[i]), level: (i + 1) as 1 | 2 | 3, usd: usd(amounts[i]), buyer, block: blk });
		}
	}
	return { edges, legs, head };
}

/** Loyalty multiplier x1.0 → x1.5: +0.1 per full month of tenure (capped). */
export function loyaltyMultiplier(tenureBlocks: bigint): number {
	const months = Number(tenureBlocks / BLOCKS_PER_MONTH);
	return Math.min(1.5, 1.0 + 0.1 * months);
}

export type ActivityStatus = 'active' | 'reduced' | 'suspended' | 'none';
/** Activity floor: a sale within 90 days = active; 90–180d = reduced (-50%); >180d = suspended. */
export function activityStatus(head: bigint, lastSaleBlock: bigint | null): ActivityStatus {
	if (lastSaleBlock === null) return 'none';
	const days = Number((head - lastSaleBlock) / BLOCKS_PER_DAY);
	if (days <= 90) return 'active';
	if (days <= 180) return 'reduced';
	return 'suspended';
}

// Performance ranks (briefing §3.5). `minSales` = direct sales; `bonusPct` = extra N1 bonus,
// paid quarterly off-chain. Displayed on-chain-derived; the bonus payout is a treasury/CRM op.
export interface Rank { key: string; name: string; minSales: number; bonusPct: number }
export const RANKS: Rank[] = [
	{ key: 'bronze', name: 'Bronze', minSales: 15, bonusPct: 5 },
	{ key: 'silver', name: 'Silver', minSales: 45, bonusPct: 12 },
	{ key: 'gold', name: 'Gold', minSales: 90, bonusPct: 20 },
	{ key: 'diamond', name: 'Diamond', minSales: 150, bonusPct: 35 },
];

export function rankFor(sales: number): { current: Rank | null; next: Rank | null; toNext: number } {
	let current: Rank | null = null;
	for (const r of RANKS) if (sales >= r.minSales) current = r;
	const next = RANKS.find((r) => sales < r.minSales) ?? null;
	return { current, next, toNext: next ? next.minSales - sales : 0 };
}

export interface AffiliateStats {
	address: string;
	directReferrals: string[]; // N1 — people who set this address as sponsor
	sales: number;             // = direct referrals (each got in via a purchase)
	downlineCount: number;     // N1+N2+N3 distinct addresses reachable
	commissionUsd: number;     // total commission attributed across all levels
	byLevel: { l1: number; l2: number; l3: number };
	rank: ReturnType<typeof rankFor>;
	loyalty: number;           // tenure multiplier x1.0 → x1.5
	activity: ActivityStatus;  // sales-recency standing
}

/** Walk the sponsor graph down to 3 levels from `addr` (distinct addresses). */
function downline(addr: string, childrenOf: Map<string, string[]>): string[] {
	const seen = new Set<string>();
	let frontier = childrenOf.get(addr) ?? [];
	for (let depth = 0; depth < 3 && frontier.length; depth++) {
		const next: string[] = [];
		for (const c of frontier) {
			if (!seen.has(c)) { seen.add(c); next.push(...(childrenOf.get(c) ?? [])); }
		}
		frontier = next;
	}
	return [...seen];
}

export function childrenMap(edges: SponsorEdge[]): Map<string, string[]> {
	const m = new Map<string, string[]>();
	for (const e of edges) {
		const arr = m.get(e.sponsor) ?? [];
		if (!arr.includes(e.buyer)) arr.push(e.buyer);
		m.set(e.sponsor, arr);
	}
	return m;
}

export function affiliateStats(addr: string, edges: SponsorEdge[], legs: FeeLeg[], head: bigint): AffiliateStats {
	const a = lc(addr);
	const children = childrenMap(edges);
	const direct = children.get(a) ?? [];
	const mine = legs.filter((l) => l.affiliate === a);
	const byLevel = { l1: 0, l2: 0, l3: 0 };
	for (const l of mine) byLevel[`l${l.level}` as 'l1' | 'l2' | 'l3'] += l.usd;

	// Tenure from this affiliate's first earning; activity from their last direct (N1) sale.
	const firstBlock = mine.length ? mine.reduce((m, l) => (l.block < m ? l.block : m), mine[0].block) : head;
	const l1Blocks = mine.filter((l) => l.level === 1).map((l) => l.block);
	const lastSaleBlock = l1Blocks.length ? l1Blocks.reduce((m, b) => (b > m ? b : m), l1Blocks[0]) : null;

	return {
		address: a,
		directReferrals: direct,
		sales: direct.length,
		downlineCount: downline(a, children).length,
		commissionUsd: byLevel.l1 + byLevel.l2 + byLevel.l3,
		byLevel,
		rank: rankFor(direct.length),
		loyalty: loyaltyMultiplier(head - firstBlock),
		activity: activityStatus(head, lastSaleBlock),
	};
}

export interface LeaderRow { address: string; referrals: number; commissionUsd: number }

/** Top affiliates ranked by commission, then by direct-referral count. */
export function leaderboard(edges: SponsorEdge[], legs: FeeLeg[], limit = 25): LeaderRow[] {
	const children = childrenMap(edges);
	const earned = new Map<string, number>();
	for (const l of legs) earned.set(l.affiliate, (earned.get(l.affiliate) ?? 0) + l.usd);
	const addrs = new Set<string>([...children.keys(), ...earned.keys()]);
	const rows: LeaderRow[] = [...addrs].map((a) => ({
		address: a,
		referrals: (children.get(a) ?? []).length,
		commissionUsd: earned.get(a) ?? 0,
	}));
	rows.sort((x, y) => y.commissionUsd - x.commissionUsd || y.referrals - x.referrals);
	return rows.slice(0, limit);
}
