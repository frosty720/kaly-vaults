import { describe, it, expect } from 'vitest';
import { withHeadroom, resolveGas } from './gas';

// Fee pinned by writes.ts. The wallet's pre-sign balance check is
// `balance >= gas * maxFeePerGas`, so these two numbers decide who can transact.
const MAX_FEE_PER_GAS = 30_000_000_000n; // 30 gwei
const OLD_PINNED_PURCHASE_GAS = 3_000_000n;

// Measured on KalyChain mainnet 2026-07-28 via `cast estimate` for
// purchase(tier=1, USDT). Confirmed against a real settled purchase the same day:
// tx 0x4e9f9ad684c578eae589f540444ee39994a92accf991c85b21d65ff8de91aea9 used
// 789,441 gas against the 3,000,000 limit — 26% of what was reserved.
const REAL_PURCHASE_ESTIMATE = 844_006n;

// Balance of the buyer whose purchase could not be signed (0.0498 KLC). The same
// wallet completed the identical purchase, with this code unchanged, once it was
// topped up to 5.047 KLC — isolating the spend ceiling as the sole blocker.
const STRANDED_BUYER_BALANCE = 49_840_015_999_626_704n;

describe('withHeadroom', () => {
	it('adds 50% to an estimate', () => {
		expect(withHeadroom(1_000_000n)).toBe(1_500_000n);
	});

	it('floors rather than rounds, keeping the result an integer', () => {
		expect(withHeadroom(1n)).toBe(1n);
		expect(withHeadroom(3n)).toBe(4n);
	});
});

describe('resolveGas', () => {
	it('uses the padded live estimate when estimation succeeds', async () => {
		const gas = await resolveGas(async () => 844_006n, OLD_PINNED_PURCHASE_GAS);
		expect(gas).toBe(1_266_009n);
	});

	it('falls back to the pinned ceiling when estimation rejects', async () => {
		const gas = await resolveGas(async () => {
			throw new Error('execution reverted');
		}, OLD_PINNED_PURCHASE_GAS);
		expect(gas).toBe(OLD_PINNED_PURCHASE_GAS);
	});

	it('falls back when the node returns a useless zero estimate', async () => {
		const gas = await resolveGas(async () => 0n, OLD_PINNED_PURCHASE_GAS);
		expect(gas).toBe(OLD_PINNED_PURCHASE_GAS);
	});

	it('honours an estimate larger than the fallback (fallback is not a cap)', async () => {
		const gas = await resolveGas(async () => 4_000_000n, OLD_PINNED_PURCHASE_GAS);
		expect(gas).toBe(6_000_000n);
	});
});

describe('spend ceiling regression (2026-07-28 stranded purchase)', () => {
	it('the old pinned limit priced the buyer out of a tx they could afford', () => {
		const oldRequirement = OLD_PINNED_PURCHASE_GAS * MAX_FEE_PER_GAS;
		const realCost = REAL_PURCHASE_ESTIMATE * MAX_FEE_PER_GAS;

		// The wallet refused to sign...
		expect(oldRequirement).toBeGreaterThan(STRANDED_BUYER_BALANCE);
		// ...even though the buyer could comfortably pay the actual cost.
		expect(realCost).toBeLessThan(STRANDED_BUYER_BALANCE);
	});

	it('an estimate-derived limit lets that same buyer sign', async () => {
		const gas = await resolveGas(async () => REAL_PURCHASE_ESTIMATE, OLD_PINNED_PURCHASE_GAS);
		expect(gas * MAX_FEE_PER_GAS).toBeLessThan(STRANDED_BUYER_BALANCE);
	});

	it('still leaves real headroom above the measured estimate', async () => {
		const gas = await resolveGas(async () => REAL_PURCHASE_ESTIMATE, OLD_PINNED_PURCHASE_GAS);
		expect(gas).toBeGreaterThan(REAL_PURCHASE_ESTIMATE);
	});
});
