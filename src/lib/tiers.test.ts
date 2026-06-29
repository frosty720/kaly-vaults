import { describe, it, expect } from 'vitest';
import {
	splitPurchase,
	ACCEPTED_STABLES,
	FEE_PCT,
	POL_PCT,
	FLOW_EXAMPLE_USD,
} from '@/lib/tiers';

describe('splitPurchase', () => {
	it('splits 1000 into 20% fees and 80% POL', () => {
		const s = splitPurchase(1000);
		expect(s.fees).toBeCloseTo(200);
		expect(s.pol).toBeCloseTo(800);
	});

	it('breaks the 20% into affiliate 10% + dev 2% + DAO 8%', () => {
		const s = splitPurchase(1000);
		expect(s.affiliate).toBeCloseTo(100); // N1 6% + N2 2.5% + N3 1.5%
		expect(s.dev).toBeCloseTo(20);
		expect(s.dao).toBeCloseTo(80);
		expect(s.affiliate + s.dev + s.dao).toBeCloseTo(s.fees);
	});

	it('reconciles pol + fees back to the input for any amount', () => {
		for (const amt of [1000, 100, 100000, 0]) {
			const s = splitPurchase(amt);
			expect(s.fees + s.pol).toBeCloseTo(amt);
		}
	});

	it('exposes consistent headline percentages', () => {
		expect(FEE_PCT + POL_PCT).toBeCloseTo(1);
		expect(FLOW_EXAMPLE_USD).toBe(1000);
	});

	it('accepts only the KLC-pair stablecoins (USDT, KUSD)', () => {
		expect([...ACCEPTED_STABLES]).toEqual(['USDT', 'KUSD']);
		expect(ACCEPTED_STABLES).not.toContain('USDC');
		expect(ACCEPTED_STABLES).not.toContain('DAI');
	});
});
