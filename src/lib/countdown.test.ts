import { describe, it, expect } from 'vitest';
import { getCountdown, VAULT_LAUNCH } from '@/lib/countdown';

// A fixed reference instant well before launch, used to build relative `now`s.
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('VAULT_LAUNCH', () => {
	it('is 12:00 noon WAT on 2026-06-30, i.e. 11:00 UTC (WAT = UTC+1, no DST)', () => {
		expect(VAULT_LAUNCH.toISOString()).toBe('2026-06-30T11:00:00.000Z');
	});
});

describe('getCountdown', () => {
	const target = new Date('2026-06-30T11:00:00.000Z');

	it('breaks a mixed remaining span into days/hours/minutes/seconds', () => {
		const now = new Date(target.getTime() - (2 * DAY + 3 * HOUR + 4 * MINUTE + 5 * SECOND));
		expect(getCountdown(target, now)).toEqual({
			days: 2,
			hours: 3,
			minutes: 4,
			seconds: 5,
			isLaunched: false,
		});
	});

	it('counts whole days correctly (no hour/minute/second remainder)', () => {
		const now = new Date(target.getTime() - 10 * DAY);
		expect(getCountdown(target, now)).toEqual({
			days: 10,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isLaunched: false,
		});
	});

	it('reports isLaunched=true and all zeros exactly at the target instant', () => {
		expect(getCountdown(target, target)).toEqual({
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isLaunched: true,
		});
	});

	it('clamps to zero (never negative) after the target has passed', () => {
		const now = new Date(target.getTime() + 5 * DAY);
		expect(getCountdown(target, now)).toEqual({
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isLaunched: true,
		});
	});

	it('floors sub-second remainders down to the current second', () => {
		const now = new Date(target.getTime() - (1 * SECOND + 750));
		expect(getCountdown(target, now)).toEqual({
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 1,
			isLaunched: false,
		});
	});
});
