'use client';

import { useVaults } from '@/lib/chain/reads';
import { TIERS } from '@/lib/tiers';
import { Skeleton } from './Skeleton';
import type { Dictionary } from '@/i18n/dictionaries/en';

interface YourVaultsProps {
	addr: `0x${string}`;
	t: Dictionary['app']['vaults'];
}

export function YourVaults({ addr, t }: YourVaultsProps) {
	const { data, isLoading, isError } = useVaults(addr);
	const count = !isLoading && !isError && data ? data.length : null;

	return (
		<section className="glass rounded-2xl p-6 sm:p-8 fade-up">
			<div className="flex items-center justify-between mb-5">
				<span className="text-xs uppercase tracking-[0.18em] font-semibold text-amber-300/80">
					{t.title}
				</span>
				{count !== null && (
					<span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 tabular-nums">
						{count}
					</span>
				)}
			</div>

			{isLoading && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Skeleton className="h-36" />
					<Skeleton className="h-36" />
				</div>
			)}

			{isError && !isLoading && <p className="text-sm text-danger">{t.error}</p>}

			{!isLoading && !isError && data && data.length === 0 && (
				<div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center text-sm text-white/45">
					{t.empty}
				</div>
			)}

			{!isLoading && !isError && data && data.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{data.map((vault) => {
						const tier = TIERS[vault.tier];
						const aprPct = tier ? `${(tier.baseApr * 100).toFixed(0)}%` : '—';
						const tierName = tier?.name ?? `Tier ${vault.tier}`;
						// Cap maturityPct display at 100 for the bar (can exceed 100 if overcapped)
						const barWidth = Math.min(vault.maturityPct, 100);

						return (
							<div
								key={vault.id.toString()}
								className="rounded-xl border border-amber-500/15 bg-white/[0.03] p-4 flex flex-col gap-3 transition-colors hover:border-amber-500/40"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs text-white/40 font-mono tabular-nums">
										#{vault.id.toString()}
									</span>
									<div className="flex items-center gap-1.5">
										{vault.matured && (
											<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/40 text-amber-400/70 border border-amber-700/40">
												{t.matured}
											</span>
										)}
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
											{tierName}
										</span>
									</div>
								</div>
								<div className="space-y-2 text-sm">
									<Row label={t.weight} value={vault.weight.toLocaleString()} />
									<Row label={t.apr} value={aprPct} accent />
								</div>

								{/* Maturity progress */}
								<div className="space-y-1">
									<div className="flex items-center justify-between text-[11px] text-white/50">
										<span>{t.maturityProgress}</span>
										<span className="tabular-nums font-mono">
											{vault.maturityPct.toFixed(2)}%
										</span>
									</div>
									<div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
										<div
											className={`h-full rounded-full transition-all ${vault.matured ? 'bg-amber-700/60' : 'bg-amber-400'}`}
											style={{ width: `${barWidth}%` }}
										/>
									</div>
								</div>

								{/* Buy-again nudge when matured */}
								{vault.matured && (
									<p className="text-[11px] text-amber-400/60 leading-snug">
										{t.buyAgain}
									</p>
								)}
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
			<span className="text-white/60">{label}</span>
			<span className={`font-bold tabular-nums ${accent ? 'text-amber-400' : 'text-white'}`}>
				{value}
			</span>
		</div>
	);
}
