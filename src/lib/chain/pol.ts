import { Token } from '@uniswap/sdk-core';
import { Pool, Position, TickMath } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';

export interface PositionInput {
	sqrtPriceX96: bigint;
	tickLower: number;
	tickUpper: number;
	liquidity: bigint;
	decimals0: number;
	decimals1: number;
	fee: number;
}

// Pure: current token amounts a position holds, derived from on-chain liquidity + live pool price.
export function positionTokenAmounts(p: PositionInput): { amount0: bigint; amount1: bigint } {
	const chainId = 3888; // token chainId is irrelevant to amount math
	const t0 = new Token(chainId, '0x0000000000000000000000000000000000000001', p.decimals0);
	const t1 = new Token(chainId, '0x0000000000000000000000000000000000000002', p.decimals1);

	// TickMath.getTickAtSqrtRatio requires JSBI — convert native bigint via string
	const sqrtRatioJsbi = JSBI.BigInt(p.sqrtPriceX96.toString());
	const tickCurrent = TickMath.getTickAtSqrtRatio(sqrtRatioJsbi);

	// Pool's BigintIsh is processed internally by JSBI which cannot handle native bigint.
	// Convert both via string → JSBI to avoid the "Cannot convert ... to a BigInt" error.
	const sqrtRatioForPool = JSBI.BigInt(p.sqrtPriceX96.toString());
	const liquidityJsbi = JSBI.BigInt(p.liquidity.toString());

	const pool = new Pool(
		t0,
		t1,
		p.fee,
		sqrtRatioForPool,
		liquidityJsbi,
		tickCurrent,
	);

	// Position also passes liquidity to JSBI internally — same conversion required.
	const position = new Position({
		pool,
		tickLower: p.tickLower,
		tickUpper: p.tickUpper,
		liquidity: liquidityJsbi,
	});

	return {
		amount0: BigInt(position.amount0.quotient.toString()),
		amount1: BigInt(position.amount1.quotient.toString()),
	};
}

// Pure: derive live USD-per-KLC from a WKLC/stable V3 pool's slot0 sqrtPriceX96.
// The stable side is treated as $1 (peg). This is the true current spot on whatever
// network the pool lives on — no external API, self-consistent with the LP it values.
//
// sqrtPriceX96 encodes sqrt(token1_raw / token0_raw) * 2^96. We recover the human-unit
// price of token1 per token0, then orient it to USD-per-KLC depending on which side is
// the stable. All scaling is done in bigint (×1e18) before the single float conversion to
// avoid precision loss on the very large sqrtPriceX96 value.
export function klcUsdFromSlot0(args: {
	sqrtPriceX96: bigint;
	stableIsToken0: boolean;
	stableDecimals: number;
}): number {
	if (args.sqrtPriceX96 <= 0n) return 0;
	const dec0 = args.stableIsToken0 ? args.stableDecimals : 18;
	const dec1 = args.stableIsToken0 ? 18 : args.stableDecimals;
	const Q96 = 2n ** 96n;
	const PRECISION = 10n ** 18n;
	// humanPrice (token1 per token0) = (sqrtP/2^96)^2 * 10^dec0 / 10^dec1, scaled by 1e18.
	const numerator = args.sqrtPriceX96 * args.sqrtPriceX96 * 10n ** BigInt(dec0) * PRECISION;
	const denominator = Q96 * Q96 * 10n ** BigInt(dec1);
	const humanPrice = Number(numerator / denominator) / 1e18;
	if (!Number.isFinite(humanPrice) || humanPrice <= 0) return 0;
	// stable=token0 → humanPrice is KLC-per-stable → invert for USD-per-KLC.
	// stable=token1 → humanPrice is stable-per-KLC = USD-per-KLC directly.
	return args.stableIsToken0 ? 1 / humanPrice : humanPrice;
}

// USD value: stable side at $1 (peg, labeled in UI), KLC side at live price (labeled in UI).
export function positionUsdValue(args: {
	amount0: bigint;
	amount1: bigint;
	decimals0: number;
	decimals1: number;
	stableIsToken0: boolean;
	klcPriceUsd: number;
}): number {
	const a0 = Number(args.amount0) / 10 ** args.decimals0;
	const a1 = Number(args.amount1) / 10 ** args.decimals1;
	const stable = args.stableIsToken0 ? a0 : a1;
	const klc = args.stableIsToken0 ? a1 : a0;
	return stable * 1 + klc * args.klcPriceUsd;
}
