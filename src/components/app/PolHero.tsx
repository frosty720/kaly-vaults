'use client';

import { usePolStats, useKlcPrice, usePolHistory, usePoolTvl } from '@/lib/chain/reads';
import { fmtUsd } from '@/lib/format';
import { Skeleton } from './Skeleton';
import { LiveBadge } from './LiveBadge';
import { AnimatedNumber } from './AnimatedNumber';
import { AreaChart } from './AreaChart';
import type { Dictionary } from '@/i18n/dictionaries/en';

export function PolHero({ t }: { t: Dictionary['app']['pol'] }) {
	const { data, isLoading, isError } = usePolStats();
	const { data: klcPrice } = useKlcPrice();
	// Cumulative POL-added trend from the subgraph (fast; doesn't block the live headline above).
	const { data: history } = usePolHistory();
	// Whole-pool TVL (everyone's liquidity) — shown alongside, NOT as protocol-owned.
	const { data: poolTvl } = usePoolTvl();

	// Per-pool live LP value from on-chain position enumeration
	const poolBreakdown = data?.perPool ?? [];

	return (
		<div className="mesh-hero glass rounded-3xl p-6 sm:p-9 fade-up">
			{/* Label + live badge */}
			<div className="relative flex items-center justify-between gap-3 mb-4">
				<span className="text-xs uppercase tracking-[0.2em] font-semibold text-amber-300/80">
					{t.label}
				</span>
				<LiveBadge updatedLabel={t.live} />
			</div>

			{/* Headline value */}
			<div className="relative mb-6">
				{isLoading ? (
					<Skeleton className="h-14 w-56" />
				) : isError ? (
					<p className="text-sm text-danger">{t.error}</p>
				) : (
					<div className="flex items-end gap-3">
						<AnimatedNumber
							value={data?.totalUsd ?? 0}
							format={fmtUsd}
							className="text-5xl sm:text-6xl font-bold text-white tabular-nums font-mono figure-glow leading-none"
						/>
						<span className="mb-1.5 text-xs font-semibold text-amber-300/70 uppercase tracking-wider">
							{t.liveValue}
						</span>
					</div>
				)}
			</div>

			{/* Cumulative POL trend (subgraph) — only shown once there's a couple of data points */}
			{history && history.length > 1 && (
				<div className="relative mb-5">
					<AreaChart points={history} emptyLabel={t.empty} />
				</div>
			)}

			{/* Per-pool breakdown chips */}
			{!isLoading && !isError && poolBreakdown.length > 0 && (
				<div className="relative flex flex-wrap gap-2 mb-4">
					{poolBreakdown.map(({ symbol, usd }) => (
						<span
							key={symbol}
							className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs"
						>
							<span className="text-white/55">KLC/{symbol}</span>
							<span className="tabular-nums font-semibold text-amber-200/90">{fmtUsd(usd)}</span>
						</span>
					))}
				</div>
			)}

			{/* Total pool liquidity (whole pool, from the V3 subgraph) — context for the owned figure */}
			{poolTvl && poolTvl.totalUsd > 0 && (
				<div className="relative mb-4 flex items-baseline gap-2 text-xs">
					<span className="text-white/45">{t.totalPool}</span>
					<span className="tabular-nums font-semibold text-white/80">{fmtUsd(poolTvl.totalUsd)}</span>
				</div>
			)}

			{/* Footnote — transparency labels */}
			<p className="relative text-[11px] text-white/40 leading-relaxed">
				{t.footnote}
				{klcPrice !== undefined ? (
					<>
						{' '}· KLC{' '}
						<span className="text-amber-300/70">
							${klcPrice.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
						</span>{' '}
						({t.klcLiveSuffix})
					</>
				) : null}
			</p>
		</div>
	);
}
