import { describe, it, expect } from 'vitest';
import { withHeadroom, resolveGas } from './gas';

// Fee pinned by writes.ts. The wallet's pre-sign balance check is
// `balance >= gas * maxFeePerGas`, so these two numbers decide who can transact.
const MAX_FEE_PER_GAS = 30_000_000_000n; // 30 gwei
const OLD_PINNED_PURCHASE_GAS = 3_000_000n;

// Mirrors writes.ts. Floor is measured from real mainnet gasUsed (see below).
const BOUNDS = { floor: 1_200_000n, fallback: OLD_PINNED_PURCHASE_GAS };

// Measured on KalyChain mainnet 2026-07-28 via `cast estimate` for
// purchase(tier=1, USDT). Confirmed against a real settled purchase the same day:
// tx 0x4e9f9ad684c578eae589f540444ee39994a92accf991c85b21d65ff8de91aea9 used
// 789,441 gas against the 3,000,000 limit — 26% of what was reserved.
const REAL_PURCHASE_ESTIMATE = 844_006n;

// Observed gasUsed across ALL 70 purchases settled on mainnet as of 2026-07-28.
const OBSERVED_GAS_MIN = 702_021n;
const OBSERVED_GAS_MAX = 846_275n;

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
	it('uses the padded live estimate when it exceeds the floor', async () => {
		const gas = await resolveGas(async () => 1_000_000n, BOUNDS);
		expect(gas).toBe(1_500_000n);
	});

	it('falls back to the pinned ceiling when estimation rejects', async () => {
		const gas = await resolveGas(async () => {
			throw new Error('execution reverted');
		}, BOUNDS);
		expect(gas).toBe(OLD_PINNED_PURCHASE_GAS);
	});

	it('falls back when the node returns a useless zero estimate', async () => {
		const gas = await resolveGas(async () => 0n, BOUNDS);
		expect(gas).toBe(OLD_PINNED_PURCHASE_GAS);
	});

	it('honours an estimate larger than the fallback (fallback is not a cap)', async () => {
		const gas = await resolveGas(async () => 4_000_000n, BOUNDS);
		expect(gas).toBe(6_000_000n);
	});
});

describe('floor protects against a bad estimate', () => {
	it('never returns less than the floor, however low the node estimates', async () => {
		for (const bogus of [1n, 21_000n, 300_000n, 700_000n]) {
			expect(await resolveGas(async () => bogus, BOUNDS)).toBe(BOUNDS.floor);
		}
	});

	it('the floor clears the worst purchase ever settled on mainnet', () => {
		expect(BOUNDS.floor).toBeGreaterThan(OBSERVED_GAS_MAX);
	});

	it('even a floor-pinned limit clears the observed max with real margin', async () => {
		const gas = await resolveGas(async () => OBSERVED_GAS_MIN, BOUNDS);
		// >= 40% headroom over the heaviest purchase on record.
		expect(gas * 10n).toBeGreaterThanOrEqual(OBSERVED_GAS_MAX * 14n);
	});

	it('a realistic estimate resolves at or above the floor, never below', async () => {
		const gas = await resolveGas(async () => REAL_PURCHASE_ESTIMATE, BOUNDS);
		expect(gas).toBeGreaterThanOrEqual(BOUNDS.floor);
		expect(gas).toBeGreaterThan(OBSERVED_GAS_MAX);
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

	it('the new limit lets that same buyer sign', async () => {
		const gas = await resolveGas(async () => REAL_PURCHASE_ESTIMATE, BOUNDS);
		expect(gas * MAX_FEE_PER_GAS).toBeLessThan(STRANDED_BUYER_BALANCE);
	});

	it('even the worst case — floor with no usable estimate — lets them sign', async () => {
		const gas = await resolveGas(async () => 1n, BOUNDS);
		expect(gas * MAX_FEE_PER_GAS).toBeLessThan(STRANDED_BUYER_BALANCE);
	});
});
