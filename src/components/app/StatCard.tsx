'use client';

import { ReactNode } from 'react';
import { Skeleton } from './Skeleton';

interface StatCardProps {
	label: string;
	/** The headline value node (e.g. an <AnimatedNumber/> or a static string). */
	value: ReactNode;
	sub?: ReactNode;
	icon?: ReactNode;
	loading?: boolean;
	error?: boolean;
	delayMs?: number;
}

export function StatCard({ label, value, sub, icon, loading, error, delayMs = 0 }: StatCardProps) {
	return (
		<div className="stat-card fade-up p-5" style={{ animationDelay: `${delayMs}ms` }}>
			<div className="flex items-center justify-between mb-3">
				<span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-amber-300/70">
					{label}
				</span>
				{icon ? <span className="text-amber-400/60">{icon}</span> : null}
			</div>
			{loading ? (
				<Skeleton className="h-8 w-24" />
			) : error ? (
				<p className="text-sm text-danger">—</p>
			) : (
				<div className="text-2xl sm:text-[1.75rem] font-bold text-white tabular-nums font-mono leading-none">
					{value}
				</div>
			)}
			{sub && !loading && !error ? <p className="text-[11px] text-white/40 mt-2">{sub}</p> : null}
		</div>
	);
}
