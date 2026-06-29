'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
	value: number;
	format: (n: number) => string;
	durationMs?: number;
	className?: string;
}

/**
 * Counts up from the previous value to the new value with an ease-out curve.
 * Honours prefers-reduced-motion (jumps straight to the value). Purely visual —
 * the displayed figure always lands exactly on the real `value`.
 */
export function AnimatedNumber({ value, format, durationMs = 900, className }: AnimatedNumberProps) {
	const [display, setDisplay] = useState(value);
	const fromRef = useRef(value);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		const from = fromRef.current;
		const to = value;
		if (reduce || from === to) {
			setDisplay(to);
			fromRef.current = to;
			return;
		}

		let start: number | null = null;
		const tick = (ts: number) => {
			if (start === null) start = ts;
			const p = Math.min(1, (ts - start) / durationMs);
			const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
			setDisplay(from + (to - from) * eased);
			if (p < 1) {
				rafRef.current = requestAnimationFrame(tick);
			} else {
				fromRef.current = to;
			}
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			fromRef.current = to;
		};
	}, [value, durationMs]);

	return <span className={className}>{format(display)}</span>;
}
