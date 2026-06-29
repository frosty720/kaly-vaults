'use client';

import { TIERS, project } from '@/lib/tiers';
import { formatUSD, formatBreakeven } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface TierCardsProps {
	priceMultiplier: number;
	dict: Dictionary;
	locale: Locale;
}

export function TierCards({ priceMultiplier, dict, locale }: TierCardsProps) {
	return (
		<section id="tiers" className="relative py-16 sm:py-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between flex-wrap gap-4 mb-8">
					<h2 className="heading-underline text-sm sm:text-base uppercase tracking-[0.2em] font-semibold text-amber-300">
						{dict.tiers.sectionTitle}
					</h2>
					<div className="text-xs text-white/50">
						{dict.tiers.valuesShownAt}{' '}
						<span className="text-amber-300 font-semibold">
							{priceMultiplier}× {dict.tiers.klcPriceSuffix}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
					{TIERS.map((tier) => {
						const p = project({
							investmentUsd: tier.price,
							baseApr: tier.baseApr,
							priceMultiplier,
						});
						const isFeatured = tier.featured;
						const audience = (dict.tiers.audiences as Record<string, string>)[tier.key] ?? tier.audience;
						return (
							<div
								key={tier.key}
								className={`relative glass glass-hover rounded-xl p-5 flex flex-col ${
									isFeatured ? 'ring-2 ring-amber-500/60' : ''
								}`}
							>
								{isFeatured && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold tracking-wider uppercase shadow-md whitespace-nowrap">
										{dict.tiers.mostPopular}
									</div>
								)}

								<div className="text-xs uppercase tracking-wider text-amber-300/80 font-bold">
									{tier.name}
								</div>
								<div className="mt-2 text-3xl font-bold text-white tabular-nums">
									{formatUSD(tier.price, locale, { compact: tier.price >= 10000 })}
								</div>
								<div className="mt-1 text-xs text-white/50">{audience}</div>

								<div className="mt-5 space-y-2.5 text-sm">
									<Row label={dict.tiers.apr} value={`${(p.apr * 100).toFixed(0)}%`} accent />
									<Row label={dict.tiers.annual} value={formatUSD(p.annualUsd, locale, { decimals: 0 })} />
									<Row label={dict.tiers.monthly} value={formatUSD(p.monthlyUsd, locale, { decimals: 0 })} />
									<Row label={dict.tiers.breakeven} value={formatBreakeven(p.breakevenMonths, locale)} />
									<Row label={dict.tiers.roi3yr} value={`${p.roi3yrPct.toFixed(0)}%`} />
								</div>

								<a
									href="#waitlist"
									className={`mt-6 block text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
										isFeatured ? 'btn-primary' : 'btn-ghost'
									}`}
								>
									{dict.tiers.joinWaitlist}
								</a>
							</div>
						);
					})}
				</div>
			</div>
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
