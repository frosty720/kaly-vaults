'use client';

import { useEffect, useState } from 'react';
import { getCountdown, VAULT_LAUNCH } from '@/lib/countdown';
import type { Dictionary } from '@/i18n/dictionaries/en';

interface CountdownProps {
	dict: Dictionary;
}

export function Countdown({ dict }: CountdownProps) {
	// `null` until mounted so the server render and first client render agree
	// (the live clock only starts after hydration — no hydration mismatch).
	const [now, setNow] = useState<Date | null>(null);

	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(id);
	}, []);

	const c = now ? getCountdown(VAULT_LAUNCH, now) : null;
	const t = dict.hero.countdown;

	if (c?.isLaunched) {
		return (
			<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm font-semibold">
				<span className="pulse-dot" aria-hidden />
				{t.launched}
			</div>
		);
	}

	const units = [
		{ label: t.days, value: c?.days },
		{ label: t.hours, value: c?.hours },
		{ label: t.minutes, value: c?.minutes },
		{ label: t.seconds, value: c?.seconds },
	];

	return (
		<div>
			<div className="text-xs font-medium tracking-wider uppercase text-white/50">
				{t.title}
			</div>
			<div className="mt-3 flex gap-3 sm:gap-4">
				{units.map((u) => (
					<div
						key={u.label}
						className="glass rounded-xl px-3 py-3 sm:px-4 min-w-[64px] sm:min-w-[76px] text-center"
					>
						<div className="text-2xl sm:text-3xl font-bold tabular-nums text-white tracking-tight">
							{u.value === undefined ? '--' : String(u.value).padStart(2, '0')}
						</div>
						<div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50">
							{u.label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
