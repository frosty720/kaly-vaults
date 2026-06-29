import { describe, it, expect } from 'vitest';
import { purchaseAmount } from './buy';

describe('purchaseAmount', () => {
	it('scales whole-USD tier price by stable decimals', () => {
		expect(purchaseAmount(1000, 6)).toBe(1000000000n);              // 1000 USDT (6dec)
		expect(purchaseAmount(100, 18)).toBe(100000000000000000000n);   // 100 KUSD (18dec)
	});

	it('handles 18-decimal stables (KUSD)', () => {
		expect(purchaseAmount(5000, 18)).toBe(5000n * 10n ** 18n);
		expect(purchaseAmount(25000, 18)).toBe(25000n * 10n ** 18n);
	});

	it('handles 6-decimal stables (USDT)', () => {
		expect(purchaseAmount(100, 6)).toBe(100_000_000n);
		expect(purchaseAmount(100000, 6)).toBe(100_000_000_000n);
	});

	it('returns a bigint', () => {
		expect(typeof purchaseAmount(1000, 6)).toBe('bigint');
	});
});
