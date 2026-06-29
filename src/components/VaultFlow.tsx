import { Lock, Repeat, Zap } from 'lucide-react';
import {
	ACCEPTED_STABLES,
	APR_FLOOR,
	BLOCK_REWARD_KLC,
	FLOW_EXAMPLE_USD,
	splitPurchase,
} from '@/lib/tiers';
import { formatUSD, interpolate } from '@/lib/utils';
import { Reveal } from './Reveal';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface VaultFlowProps {
	dict: Dictionary;
	locale: Locale;
}

export function VaultFlow({ dict, locale }: VaultFlowProps) {
	const f = dict.flow;
	const split = splitPurchase(FLOW_EXAMPLE_USD);
	const tokens = ACCEPTED_STABLES.join(' · ');
	const examplePaid = interpolate(f.paidAmount, {
		amount: formatUSD(FLOW_EXAMPLE_USD, locale),
	});
	const rewards = interpolate(f.rewardsStream, { klcPerBlock: BLOCK_REWARD_KLC });
	const floor = interpolate(f.floorNote, { aprFloor: `${Math.round(APR_FLOOR * 100)}%` });

	const wheel = [
		{ pos: 'top', label: f.wheelMoreSales },
		{ pos: 'right', label: f.wheelDeeperLiquidity },
		{ pos: 'bottom', label: f.wheelPriceUp },
		{ pos: 'left', label: f.wheelHigherApr },
	] as const;

	return (
		<section id="how-it-works" className="relative py-16 sm:py-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3 mb-2">
					<Repeat className="w-5 h-5 text-amber-500" aria-hidden />
					<p className="heading-underline text-sm sm:text-base uppercase tracking-[0.2em] font-semibold text-amber-300">
						{f.sectionLabel}
					</p>
				</div>
				<h2 className="text-2xl sm:text-3xl font-bold text-white mb-10">{f.heading}</h2>

				<div className="glass rounded-2xl p-6 sm:p-8 lg:p-10 space-y-10">
					{/* Proportion bar */}
					<Reveal>
						<div className="text-[10px] uppercase tracking-[0.14em] text-amber-300/80 font-medium mb-3">
							{f.step1Label}
						</div>
						<div className="flow-bar">
							<div className="flow-bar-seg flow-bar-fees">{f.feesShare}</div>
							<div className="flow-bar-seg flow-bar-pol">{f.polShare}</div>
						</div>
						<div className="mt-3 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-white/60">
							<span>{f.feesCaption}</span>
							<span>{f.polCaption}</span>
						</div>
					</Reveal>

					<div className="border-t border-white/10" />

					{/* Waterfall */}
					<Reveal delay={80}>
						<div className="text-[10px] uppercase tracking-[0.14em] text-amber-300/80 font-medium mb-4">
							{f.step2Label}
						</div>
						<div className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.12] to-transparent p-4 text-center">
							<div className="text-[10px] uppercase tracking-wider text-white/50">
								{f.paidLabel}
							</div>
							<div className="text-2xl font-bold text-amber-300 tabular-nums">{examplePaid}</div>
							<div className="text-xs text-white/50 mt-0.5">
								{f.acceptedPrefix} {tokens}
							</div>
						</div>
						<div className="text-amber-500 text-center my-3" aria-hidden>
							▼
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center text-sm text-white/80">
								{f.feesShare}
								<div className="text-amber-300/90 font-semibold tabular-nums mt-1">
									{formatUSD(split.fees, locale)}
								</div>
							</div>
							<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm text-white/90">
								<Lock className="w-4 h-4 text-amber-300 inline mr-1 -mt-0.5" aria-hidden />
								<span className="text-amber-300 font-semibold">{f.lockedForever}</span>
								<br />
								{f.treasury}
								<div className="text-amber-300/90 font-semibold tabular-nums mt-1">
									{formatUSD(split.pol, locale)}
								</div>
							</div>
						</div>
						<p className="mt-4 text-xs text-white/55 leading-relaxed">{f.polMechanism}</p>
						<div className="mt-6 rounded-lg border border-amber-500/30 bg-white/5 p-4">
							<div className="flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-wider font-semibold mb-1">
								<Zap className="w-3.5 h-3.5" aria-hidden />
								{f.rewardsTitle}
							</div>
							<p className="text-sm text-white/70 leading-relaxed">{rewards}</p>
						</div>
					</Reveal>

					<div className="border-t border-white/10" />

					{/* Flywheel */}
					<Reveal delay={160}>
						<div className="text-[10px] uppercase tracking-[0.14em] text-amber-300/80 font-medium mb-4">
							{f.step3Label}
						</div>

						{/* Mobile: vertical list */}
						<ol className="sm:hidden space-y-2">
							{wheel.map((w, i) => (
								<li
									key={w.pos}
									className="rounded-lg border border-amber-500/30 bg-white/5 p-3 text-center text-sm text-white/80"
								>
									{w.label}
									{i < wheel.length - 1 && (
										<div className="text-amber-500 mt-1" aria-hidden>
											↓
										</div>
									)}
								</li>
							))}
						</ol>

						{/* Desktop: circular */}
						<div className="hidden sm:block">
							<div className="flow-wheel">
								{wheel.map((w) => (
									<div
										key={w.pos}
										data-pos={w.pos}
										className="flow-wheel-item rounded-lg border border-amber-500/40 bg-white/5 p-2 text-xs font-semibold text-white/80"
									>
										{w.label}
									</div>
								))}
								<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
									<Repeat className="w-5 h-5 text-amber-500 mx-auto" aria-hidden />
									<div className="text-sm font-bold text-amber-300 mt-1">{f.wheelCenter}</div>
								</div>
							</div>
						</div>

						<p className="mt-6 text-sm text-white/60 leading-relaxed text-center max-w-2xl mx-auto">
							{floor}
						</p>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
