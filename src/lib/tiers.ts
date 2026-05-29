export const BLOCKS_PER_DAY = 43200;
export const DAYS_PER_YEAR = 365;
export const BLOCK_REWARD_KLC = 3;
export const BASE_KLC_PRICE = 0.0022;
export const ANNUAL_KLC_TO_POOL = BLOCKS_PER_DAY * BLOCK_REWARD_KLC * DAYS_PER_YEAR; // 47,304,000 KLC/yr
export const APR_FLOOR = 0.15;

export type TierKey = 'light' | 'validator' | 'enterprise' | 'consortium' | 'genesis';

export interface Tier {
	key: TierKey;
	name: string;
	price: number;
	baseApr: number;
	audience: string;
	featured: boolean;
	accent: string;
}

export const TIERS: readonly Tier[] = [
	{
		key: 'light',
		name: 'Light',
		price: 100,
		baseApr: 0.15,
		audience: 'Everyone',
		featured: false,
		accent: '#fbbf24',
	},
	{
		key: 'validator',
		name: 'Validator',
		price: 1000,
		baseApr: 0.20,
		audience: 'Crypto investors',
		featured: true,
		accent: '#f59e0b',
	},
	{
		key: 'enterprise',
		name: 'Enterprise',
		price: 5000,
		baseApr: 0.25,
		audience: 'Fintechs & business',
		featured: false,
		accent: '#f59e0b',
	},
	{
		key: 'consortium',
		name: 'Consortium',
		price: 25000,
		baseApr: 0.30,
		audience: 'Institutions',
		featured: false,
		accent: '#d97706',
	},
	{
		key: 'genesis',
		name: 'Genesis',
		price: 100000,
		baseApr: 0.35,
		audience: 'Funds & whales',
		featured: false,
		accent: '#d97706',
	},
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
export const ACCEPTED_STABLES = ['USDT', 'USDC', 'DAI', 'KUSD'] as const;

/** Total fees taken on purchase: 3% dev + 3% ambassador + 3% builders. */
export const FEE_PCT = 0.09;
/** Each individual fee leg (dev / ambassador / builders). */
export const FEE_LEG_PCT = 0.03;
/** Share of the purchase that becomes protocol-owned liquidity. */
export const POL_PCT = 0.91;
/** Half of the POL is swapped to KLC; the rest is kept as the stable side, both paired as permanent LP. */
export const POL_TO_KLC_PCT = 0.5;
/** Fixed worked example (USD) shown in the flow diagram. */
export const FLOW_EXAMPLE_USD = 1000;

export interface PurchaseSplit {
	fees: number;
	dev: number;
	ambassador: number;
	builders: number;
	pol: number;
	polToKlc: number;
	polToLp: number;
}

/**
 * Break a vault purchase into its on-chain destinations.
 * 9% fees (three equal legs) + 91% protocol-owned liquidity (half swapped to KLC,
 * half kept as the stable side, both paired into permanent LP).
 */
export function splitPurchase(amountUsd: number): PurchaseSplit {
	const leg = amountUsd * FEE_LEG_PCT;
	const fees = amountUsd * FEE_PCT;
	const pol = amountUsd * POL_PCT;
	const polToKlc = pol * POL_TO_KLC_PCT;
	const polToLp = pol - polToKlc;
	return { fees, dev: leg, ambassador: leg, builders: leg, pol, polToKlc, polToLp };
}
