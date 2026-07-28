import { describe, it, expect } from 'vitest';
import { paidLegs, DEFAULT_FEE_SPLIT, type FeeSplit } from './affiliate';

// A purchase of `usd` dollars at `dec` decimals, with the given levels rolled to the DAO.
// Mirrors VaultManager._routeFees: every leg amount is emitted regardless of payment; only the
// DAO amount absorbs the unpaid ones.
function event(usd: number, dec: number, unpaid: (1 | 2 | 3)[], split: FeeSplit = DEFAULT_FEE_SPLIT) {
	const amount = BigInt(usd) * 10n ** BigInt(dec);
	const bps = (b: number) => (amount * BigInt(b)) / 10000n;
	const amounts: [bigint, bigint, bigint] = [bps(split.n1Bps), bps(split.n2Bps), bps(split.n3Bps)];
	const rolled = unpaid.reduce((s, l) => s + amounts[l - 1], 0n);
	return { amounts, devAmt: bps(split.devBps), daoAmt: bps(split.daoBps) + rolled };
}

describe('paidLegs', () => {
	it('marks every leg paid when nothing rolled to the DAO', () => {
		const e = event(100, 6, []);
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt)).toEqual([true, true, true]);
	});

	// Each single-leg case is distinguishable only because 600/250/150 bps give distinct amounts.
	it.each([
		[[1], [false, true, true]],
		[[2], [true, false, true]],
		[[3], [true, true, false]],
		[[2, 3], [true, false, false]],
		[[1, 2, 3], [false, false, false]],
	] as [(1 | 2 | 3)[], boolean[]][])('identifies exactly which legs rolled to the DAO: %j', (unpaid, expected) => {
		const e = event(1000, 6, unpaid);
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt)).toEqual(expected);
	});

	it('works at 18 decimals and at the smallest and largest tier prices', () => {
		for (const [usd, dec] of [[50, 18], [50, 6], [100000, 18], [100000, 6]] as [number, number][]) {
			const e = event(usd, dec, [2]);
			expect(paidLegs(e.amounts, e.devAmt, e.daoAmt)).toEqual([true, false, true]);
		}
	});

	it('honours a non-default split', () => {
		const split: FeeSplit = { n1Bps: 800, n2Bps: 400, n3Bps: 100, devBps: 300, daoBps: 400 };
		const e = event(1000, 6, [1, 3], split);
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt, split)).toEqual([false, true, false]);
	});

	it('returns null rather than guessing when the split used to reconcile is wrong', () => {
		const e = event(1000, 6, [2], { ...DEFAULT_FEE_SPLIT, daoBps: 400 });
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt, DEFAULT_FEE_SPLIT)).toBeNull();
	});

	it('returns null when two legs share an amount (the unpaid subset is ambiguous)', () => {
		const split: FeeSplit = { ...DEFAULT_FEE_SPLIT, n2Bps: 250, n3Bps: 250 };
		const e = event(1000, 6, [2], split);
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt, split)).toBeNull();
	});

	it('returns null when devBps is zero, so daoBase cannot be reconstructed', () => {
		const e = event(1000, 6, []);
		expect(paidLegs(e.amounts, e.devAmt, e.daoAmt, { ...DEFAULT_FEE_SPLIT, devBps: 0 })).toBeNull();
	});

	it('tolerates the rounding drift from reconstructing daoBase through two floor divisions', () => {
		// An amount deliberately not divisible by the bps denominators.
		const amount = 1_234_567n;
		const bps = (b: number) => (amount * BigInt(b)) / 10000n;
		const amounts: [bigint, bigint, bigint] = [bps(600), bps(250), bps(150)];
		const daoAmt = bps(800) + amounts[1];
		expect(paidLegs(amounts, bps(200), daoAmt)).toEqual([true, false, true]);
	});

	// Ground truth: mainnet tx 0xf3ca68e3…ba19e — a $1000 pack where level2 was named in the event
	// but held no vault, so its $25 went to the DAO ($120 = $80 base + $25 + $15).
	it('reproduces the verified mainnet phantom-leg case', () => {
		expect(paidLegs([60_000_000n, 25_000_000n, 15_000_000n], 20_000_000n, 120_000_000n))
			.toEqual([true, false, false]);
	});
});
