import { describe, it, expect } from 'vitest';
import {
	splitPurchase,
	ACCEPTED_STABLES,
	FEE_PCT,
	POL_PCT,
	FLOW_EXAMPLE_USD,
} from '@/lib/tiers';

describe('splitPurchase', () => {
	it('splits 1000 into 9% fees and 91% POL', () => {
		const s = splitPurchase(1000);
		expect(s.fees).toBeCloseTo(90);
		expect(s.pol).toBeCloseTo(910);
	});

	it('breaks fees into three equal 3% legs that sum to total fees', () => {
		const s = splitPurchase(1000);
		expect(s.dev).toBeCloseTo(30);
		expect(s.ambassador).toBeCloseTo(30);
		expect(s.builders).toBeCloseTo(30);
		expect(s.dev + s.ambassador + s.builders).toBeCloseTo(s.fees);
		expect(s.dev).toBeCloseTo(s.fees / 3);
		expect(s.ambassador).toBeCloseTo(s.fees / 3);
		expect(s.builders).toBeCloseTo(s.fees / 3);
	});

	it('reconciles fees + pol back to the input for any amount', () => {
		for (const amt of [1000, 100, 100000, 0]) {
			const s = splitPurchase(amt);
			expect(s.fees + s.pol).toBeCloseTo(amt);
		}
	});

	it('swaps half of POL to KLC and pairs the rest as LP', () => {
		const s = splitPurchase(1000);
		expect(s.polToKlc).toBeCloseTo(s.pol * 0.5);
		expect(s.polToKlc + s.polToLp).toBeCloseTo(s.pol);
	});

	it('exposes consistent headline percentages', () => {
		expect(FEE_PCT + POL_PCT).toBeCloseTo(1);
		expect(FLOW_EXAMPLE_USD).toBe(1000);
	});

	it('includes DAI among the accepted stablecoins', () => {
		expect(ACCEPTED_STABLES).toContain('DAI');
		expect([...ACCEPTED_STABLES]).toEqual(['USDT', 'USDC', 'DAI', 'KUSD']);
	});
});
