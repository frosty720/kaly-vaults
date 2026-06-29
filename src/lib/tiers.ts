export const BLOCKS_PER_DAY = 43200;
export const DAYS_PER_YEAR = 365;
export const BLOCK_REWARD_KLC = 3;
export const BASE_KLC_PRICE = 0.0022;
export const ANNUAL_KLC_TO_POOL = BLOCKS_PER_DAY * BLOCK_REWARD_KLC * DAYS_PER_YEAR; // 47,304,000 KLC/yr
export const APR_FLOOR = 0.15;

// 8 packs — must match the on-chain tier indices (0..7) of the deployed VaultManager.
export type TierKey =
	| 'starter' | 'basic' | 'pro1k' | 'pro5k'
	| 'premium10k' | 'premium25k' | 'elite50k' | 'whale100k';

export interface Tier {
	key: TierKey;
	name: string;
	price: number;
	baseApr: number; // "Return %" — paid in KLC, sets the reward weight
	audience: string;
	featured: boolean;
	accent: string;
}

export const TIERS: readonly Tier[] = [
	{ key: 'starter',     name: 'Starter',     price: 50,     baseApr: 0.30, audience: 'Everyone',     featured: false, accent: '#fbbf24' },
	{ key: 'basic',       name: 'Basic',       price: 100,    baseApr: 0.40, audience: 'Testers',      featured: false, accent: '#fbbf24' },
	{ key: 'pro1k',       name: 'Pro 1K',      price: 1000,   baseApr: 0.50, audience: 'Investors',    featured: true,  accent: '#f59e0b' },
	{ key: 'pro5k',       name: 'Pro 5K',      price: 5000,   baseApr: 0.60, audience: 'SMEs',         featured: false, accent: '#f59e0b' },
	{ key: 'premium10k',  name: 'Premium 10K', price: 10000,  baseApr: 0.70, audience: 'Enterprises',  featured: false, accent: '#f59e0b' },
	{ key: 'premium25k',  name: 'Premium 25K', price: 25000,  baseApr: 0.80, audience: 'Institutions', featured: false, accent: '#d97706' },
	{ key: 'elite50k',    name: 'Elite 50K',   price: 50000,  baseApr: 1.00, audience: 'Funds',        featured: false, accent: '#d97706' },
	{ key: 'whale100k',   name: 'Whale 100K',  price: 100000, baseApr: 1.40, audience: 'Whales',       featured: false, accent: '#d97706' },
] as const;

export interface ProjectionInputs {
	investmentUsd: number;
	baseApr: number;
	priceMultiplier: number;
}

export interface Projection {
	apr: number;
	annualUsd: number;
	monthlyUsd: number;
	breakevenMonths: number;
	roi3yrPct: number;
	klcPriceUsd: number;
}

/**
 * APR is paid in KLC, so when KLC price moves, the USD APR scales linearly.
 * Returns are computed against the user's full investment amount.
 */
export function project({ investmentUsd, baseApr, priceMultiplier }: ProjectionInputs): Projection {
	const apr = baseApr * priceMultiplier;
	const annualUsd = investmentUsd * apr;
	const monthlyUsd = annualUsd / 12;
	const breakevenMonths = apr > 0 ? 12 / apr : Infinity;
	const roi3yrPct = apr * 3 * 100;
	const klcPriceUsd = BASE_KLC_PRICE * priceMultiplier;
	return { apr, annualUsd, monthlyUsd, breakevenMonths, roi3yrPct, klcPriceUsd };
}

export function tierByKey(key: TierKey): Tier {
	const t = TIERS.find((t) => t.key === key);
	if (!t) throw new Error(`Unknown tier: ${key}`);
	return t;
}

/** Stablecoins accepted as payment when purchasing a vault. */
export const ACCEPTED_STABLES = ['USDT', 'KUSD'] as const;

/** 80/20 split. POL is locked permanent liquidity; the 20% funds growth + ops. */
export const POL_PCT = 0.80;
export const FEE_PCT = 0.20;
/** Affiliate (3-level MLM): N1 6% + N2 2.5% + N3 1.5% = 10%, paid in the purchase stablecoin. */
export const AFFILIATE_PCT = 0.10;
export const N1_PCT = 0.06;
export const N2_PCT = 0.025;
export const N3_PCT = 0.015;
/** Dev multisig (2%) and DAO treasury bucket (8% — builders/performers/marketing/stabilization/security). */
export const DEV_PCT = 0.02;
export const DAO_PCT = 0.08;
/** Fixed worked example (USD) shown in the flow diagram. */
export const FLOW_EXAMPLE_USD = 1000;

export interface PurchaseSplit {
	pol: number;
	fees: number;
	affiliate: number;
	dev: number;
	dao: number;
}

/**
 * Break a vault purchase into its on-chain destinations (80/20 + 3-level MLM).
 * 80% permanent liquidity; 20% = 10% affiliate (N1/N2/N3) + 2% dev + 8% DAO treasury.
 */
export function splitPurchase(amountUsd: number): PurchaseSplit {
	return {
		pol: amountUsd * POL_PCT,
		fees: amountUsd * FEE_PCT,
		affiliate: amountUsd * AFFILIATE_PCT,
		dev: amountUsd * DEV_PCT,
		dao: amountUsd * DAO_PCT,
	};
}
