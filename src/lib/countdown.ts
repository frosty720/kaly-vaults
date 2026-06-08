/**
 * Public vault launch instant: 12:00 noon WAT (West Africa Time) on 2026-06-30.
 * WAT is a fixed UTC+1 offset with no daylight saving, so the `+01:00` literal
 * is unambiguous — it resolves to 11:00 UTC.
 */
export const VAULT_LAUNCH = new Date('2026-06-30T12:00:00+01:00');

export interface Countdown {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	/** True once `now` has reached or passed `target`. */
	isLaunched: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Break the span between `now` and `target` into whole days/hours/minutes/seconds.
 * Clamps to all-zero (never negative) once the target has passed, and flags that
 * state via `isLaunched`. Pure and deterministic — `now` is injected, not read.
 */
export function getCountdown(target: Date, now: Date): Countdown {
	const remaining = target.getTime() - now.getTime();
	if (remaining <= 0) {
		return { days: 0, hours: 0, minutes: 0, seconds: 0, isLaunched: true };
	}
	return {
		days: Math.floor(remaining / DAY),
		hours: Math.floor((remaining % DAY) / HOUR),
		minutes: Math.floor((remaining % HOUR) / MINUTE),
		seconds: Math.floor((remaining % MINUTE) / SECOND),
		isLaunched: false,
	};
}
