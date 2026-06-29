import { describe, it, expect } from 'vitest';
import { klcUsdFromSlot0, positionTokenAmounts, positionUsdValue } from './pol';

describe('positionTokenAmounts', () => {
	// Full-range position, price = 1 (sqrtPriceX96 = 2**96), liquidity 1e18 → ~equal token amounts.
	it('splits ~50/50 at price 1', () => {
		const { amount0, amount1 } = positionTokenAmounts({
			sqrtPriceX96: 79228162514264337593543950336n, // 2**96
			tickLower: -887220, tickUpper: 887220,
			liquidity: 1000000000000000000n,
			decimals0: 18, decimals1: 18,
			fee: 3000,
		});
		const r = Number(amount0) / Number(amount1);
		expect(r).toBeGreaterThan(0.98);
		expect(r).toBeLessThan(1.02);
	});

	// Stronger test: price = 4 (sqrtPriceX96 = 2**97), both tokens 18-dec.
	// At price = 4 the SDK should return ~4x more token1 than token0 (raw units),
	// because pool price encodes token1/token0 = 4.
	it('returns correct amounts at price = 4 (non-1 price)', () => {
		// sqrtPriceX96 = sqrt(4) * 2^96 = 2 * 2^96 = 2^97
		const sqrtPrice4 = 2n ** 97n;
		const { amount0, amount1 } = positionTokenAmounts({
			sqrtPriceX96: sqrtPrice4,
			tickLower: -887220, tickUpper: 887220,
			liquidity: 1000000000000000000n,
			decimals0: 18, decimals1: 18,
			fee: 3000,
		});
		// At price=4: amount1_raw / amount0_raw ≈ 4 for a full-range position
		expect(amount0).toBeGreaterThan(0n);
		expect(amount1).toBeGreaterThan(0n);
		const ratio = Number(amount1) / Number(amount0);
		expect(ratio).toBeGreaterThan(3.9);
		expect(ratio).toBeLessThan(4.1);
	});

	// Mixed decimals: USDT (6-dec, token0) / WKLC (18-dec, token1).
	// Price: 1 USDT = 1000 KLC  →  1 KLC = 0.001 USDT.
	// raw pool price = token1_raw / token0_raw = 1e21 / 1e6 = 1e15.
	// sqrtPriceX96 ≈ sqrt(1e15) * 2^96.
	it('handles mixed decimals (USDT 6-dec / WKLC 18-dec) and returns non-negative amounts', () => {
		// sqrt(1e15) * 2^96 computed off-chain to avoid floating imprecision:
		// sqrt(1e15) = 31622776.601... so sqrtPriceX96 ≈ 2505414483750479185640894519903780864
		const sqrtPriceForKlc = 2505414483750479185640894519903780864n;
		const { amount0, amount1 } = positionTokenAmounts({
			sqrtPriceX96: sqrtPriceForKlc,
			tickLower: -887220, tickUpper: 887220,
			liquidity: 1000000000000000000n,
			decimals0: 6,
			decimals1: 18,
			fee: 3000,
		});
		expect(amount0).toBeGreaterThanOrEqual(0n);
		expect(amount1).toBeGreaterThanOrEqual(0n);
		// Both sides should have non-zero liquidity for an in-range full-range position
		expect(amount0).toBeGreaterThan(0n);
		expect(amount1).toBeGreaterThan(0n);
		// USD value should be roughly balanced: stable side at $1, KLC side at $0.001/KLC
		const stableUsd = Number(amount0) / 1e6;
		const klcUsd = (Number(amount1) / 1e18) * 0.001;
		// For a full-range position the value split is roughly 50/50 (within a factor of 2)
		const ratio = stableUsd / klcUsd;
		expect(ratio).toBeGreaterThan(0.5);
		expect(ratio).toBeLessThan(2.0);
	});

	// Out-of-range positions must return non-negative amounts (no negative bigint from SDK).
	it('returns non-negative amounts for out-of-range positions', () => {
		// price = 4 (tick ~13863), position range 15000–20000 (above current) → all token0, zero token1
		const sqrtPrice4 = 2n ** 97n;
		const above = positionTokenAmounts({
			sqrtPriceX96: sqrtPrice4,
			tickLower: 15000, tickUpper: 887220,
			liquidity: 1000000000000000000n,
			decimals0: 18, decimals1: 18,
			fee: 3000,
		});
		expect(above.amount0).toBeGreaterThan(0n);
		expect(above.amount1).toEqual(0n);

		// position range -5000 to -1000 (below current) → zero token0, all token1
		// nearest multiple of 60 for MEDIUM ticks
		const below = positionTokenAmounts({
			sqrtPriceX96: sqrtPrice4,
			tickLower: -4980, tickUpper: -960,
			liquidity: 1000000000000000000n,
			decimals0: 18, decimals1: 18,
			fee: 3000,
		});
		expect(below.amount0).toEqual(0n);
		expect(below.amount1).toBeGreaterThan(0n);
	});
});

describe('klcUsdFromSlot0', () => {
	// Price = 1, both 18-dec, stable is token0 → 1 stable = 1 KLC → $1.00/KLC.
	it('returns 1.0 at price 1 (stable token0, equal decimals)', () => {
		const p = klcUsdFromSlot0({
			sqrtPriceX96: 79228162514264337593543950336n, // 2**96
			stableIsToken0: true, stableDecimals: 18,
		});
		expect(p).toBeCloseTo(1, 9);
	});

	// Mixed decimals: USDT (6-dec, token0) / WKLC (18-dec, token1).
	// raw pool price = token1_raw/token0_raw = 1e15 → human KLC-per-stable = 1000 → $0.001/KLC.
	it('handles USDT(6,token0)/WKLC(18,token1): 1000 KLC per USDT → $0.001/KLC', () => {
		const p = klcUsdFromSlot0({
			sqrtPriceX96: 2505414483750479185640894519903780864n, // sqrt(1e15)*2^96
			stableIsToken0: true, stableDecimals: 6,
		});
		expect(p).toBeCloseTo(0.001, 6);
	});

	// stable is token1, KLC is token0: humanPrice (token1 per token0) = stable per KLC = USD/KLC directly.
	// price = 4 (sqrtP = 2^97), both 18-dec → $4.00/KLC.
	it('handles stableIsToken0=false (KLC token0): price 4 → $4.00/KLC', () => {
		const p = klcUsdFromSlot0({
			sqrtPriceX96: 2n ** 97n, // sqrt(4)*2^96
			stableIsToken0: false, stableDecimals: 18,
		});
		expect(p).toBeCloseTo(4, 6);
	});

	it('returns 0 for a zero/invalid sqrtPriceX96', () => {
		expect(klcUsdFromSlot0({ sqrtPriceX96: 0n, stableIsToken0: true, stableDecimals: 18 })).toBe(0);
	});
});

describe('positionUsdValue', () => {
	it('values stable side at $1 and KLC side at the live price', () => {
		// 100 units of an 18-dec stable (token0) + 50000 units of 18-dec WKLC (token1) at $0.002/KLC
		const usd = positionUsdValue({
			amount0: 100000000000000000000n, amount1: 50000000000000000000000n,
			decimals0: 18, decimals1: 18, stableIsToken0: true, klcPriceUsd: 0.002,
		});
		expect(usd).toBeCloseTo(100 + 50000 * 0.002, 6); // 100 + 100 = 200
	});

	it('correctly handles stableIsToken0=false (stable is token1, KLC is token0)', () => {
		// 50000 WKLC (18-dec, token0) + 100 stable (18-dec, token1), at $0.002/KLC
		const usd = positionUsdValue({
			amount0: 50000000000000000000000n, amount1: 100000000000000000000n,
			decimals0: 18, decimals1: 18, stableIsToken0: false, klcPriceUsd: 0.002,
		});
		expect(usd).toBeCloseTo(100 + 50000 * 0.002, 6); // same result = 200
	});

	it('correctly handles mixed decimals: USDT (6-dec, token0) / WKLC (18-dec, token1)', () => {
		// 44721.36 USDT + 22360679.77 KLC at $0.002/KLC ≈ 89442.72 total
		const usd = positionUsdValue({
			amount0: 44721359549n,                       // USDT 6-dec
			amount1: 22360679774997897446155548n,         // WKLC 18-dec
			decimals0: 6, decimals1: 18,
			stableIsToken0: true, klcPriceUsd: 0.002,
		});
		// stable: 44721359549 / 1e6 = 44721.36 USDT
		// klc:    22360679774997897446155548 / 1e18 ≈ 22360679.77 KLC * 0.002 ≈ 44721.36 USD
		expect(usd).toBeCloseTo(89442.72, 0); // within $1
	});
});
