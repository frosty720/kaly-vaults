'use client';

import { useMemo, useState } from 'react';
import { Calculator as CalcIcon, TrendingUp } from 'lucide-react';
import { TIERS, project, tierByKey, type TierKey } from '@/lib/tiers';
import { formatUSD, formatBreakeven, interpolate } from '@/lib/utils';
import { PriceSlider } from './PriceSlider';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

const AMOUNT_PRESETS = [100, 500, 1000, 5000, 25000, 100000];

interface InvestmentCalculatorProps {
	priceMultiplier: number;
	onPriceMultiplierChange: (v: number) => void;
	dict: Dictionary;
	locale: Locale;
	klcPrice: number;
}

export function InvestmentCalculator({
	priceMultiplier,
	onPriceMultiplierChange,
	dict,
	locale,
	klcPrice,
}: InvestmentCalculatorProps) {
	const [amount, setAmount] = useState<number>(1000);
	const [selectedTier, setSelectedTier] = useState<TierKey>('validator');

	const tier = tierByKey(selectedTier);
	const audience = dict.tiers.audiences[tier.key];

	const projection = useMemo(
		() => project({ investmentUsd: amount, baseApr: tier.baseApr, priceMultiplier }),
		[amount, tier.baseApr, priceMultiplier],
	);

	const nftCount = amount / tier.price;
	const nftCountDisplay = (() => {
		if (nftCount >= 1 && Number.isInteger(nftCount)) {
			const template = nftCount === 1 ? dict.calculator.nftSingular : dict.calculator.nftPlural;
			return interpolate(template, { n: nftCount, name: tier.name });
		}
		return interpolate(dict.calculator.nftFractional, {
			n: nftCount.toFixed(2),
			name: tier.name,
		});
	})();

	return (
		<section id="calculator" className="relative py-16 sm:py-20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3 mb-8">
					<CalcIcon className="w-5 h-5 text-amber-500" aria-hidden />
					<h2 className="heading-underline text-sm sm:text-base uppercase tracking-[0.2em] font-semibold text-amber-300">
						{dict.calculator.sectionTitle}
					</h2>
				</div>

				<div className="glass rounded-2xl p-6 sm:p-8 lg:p-10">
					<div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
						<div className="lg:col-span-3 space-y-8">
							<div>
								<label htmlFor="amount-input" className="block text-xs uppercase tracking-wider text-amber-300/80 font-medium mb-2">
									{dict.calculator.investmentAmount}
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">$</span>
									<input
										id="amount-input"
										type="number"
										min={0}
										step={100}
										value={amount}
										onChange={(e) => {
											const v = parseFloat(e.target.value);
											setAmount(Number.isFinite(v) && v >= 0 ? v : 0);
										}}
										className="input-field w-full pl-8 pr-4 py-3 rounded-lg text-2xl font-bold tabular-nums"
									/>
								</div>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{AMOUNT_PRESETS.map((p) => (
										<button
											key={p}
											type="button"
											onClick={() => setAmount(p)}
											className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
												amount === p
													? 'bg-amber-500 text-black shadow-md'
													: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											{p >= 1000 ? `$${p / 1000}k` : `$${p}`}
										</button>
									))}
								</div>
							</div>

							<div>
								<div className="block text-xs uppercase tracking-wider text-amber-300/80 font-medium mb-2">
									{dict.calculator.vaultTier}
								</div>
								<div className="grid grid-cols-5 gap-1.5">
									{TIERS.map((t) => (
										<button
											key={t.key}
											type="button"
											onClick={() => setSelectedTier(t.key)}
											aria-pressed={selectedTier === t.key}
											className={`px-2 py-3 rounded-lg text-center transition-all ${
												selectedTier === t.key
													? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30'
													: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
											}`}
										>
											<div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
												{t.name}
											</div>
											<div className="text-xs sm:text-sm font-semibold mt-1 tabular-nums">
												{(t.baseApr * 100).toFixed(0)}%
											</div>
										</button>
									))}
								</div>
								<div className="mt-2 text-xs text-white/50">
									{tier.name} {dict.calculator.baseNftPrice}:{' '}
									<span className="text-amber-300 font-semibold">{formatUSD(tier.price, locale)}</span>{' '}
									· {dict.calculator.target}: {audience}
								</div>
							</div>

							<PriceSlider
								multiplier={priceMultiplier}
								onChange={onPriceMultiplierChange}
								dict={dict}
								locale={locale}
								klcPrice={klcPrice}
							/>
						</div>

						<div className="lg:col-span-2">
							<div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-6 sm:p-7 h-full">
								<div className="flex items-center gap-2 text-amber-300 text-xs uppercase tracking-wider font-semibold">
									<TrendingUp className="w-4 h-4" aria-hidden />
									{dict.calculator.projectedReturns}
								</div>

								<div className="mt-5">
									<div className="text-xs text-white/50 uppercase tracking-wider">
										{dict.calculator.effectiveApr}
									</div>
									<div className="mt-1 text-5xl font-bold text-amber-400 tabular-nums">
										{(projection.apr * 100).toFixed(1)}%
									</div>
									<div className="mt-1 text-xs text-white/50">
										{interpolate(dict.calculator.breakdown, {
											base: `${(tier.baseApr * 100).toFixed(0)}%`,
											mult: `${priceMultiplier}×`,
										})}
									</div>
								</div>

								<div className="mt-6 grid grid-cols-2 gap-4">
									<Stat label={dict.calculator.annual} value={formatUSD(projection.annualUsd, locale, { decimals: 0 })} />
									<Stat label={dict.calculator.monthly} value={formatUSD(projection.monthlyUsd, locale, { decimals: 0 })} />
									<Stat label={dict.calculator.breakeven} value={formatBreakeven(projection.breakevenMonths, locale)} />
									<Stat label={dict.calculator.roi3yr} value={`${projection.roi3yrPct.toFixed(0)}%`} />
								</div>

								<div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/60 leading-relaxed">
									{dict.calculator.mappingPrefix}{' '}
									<span className="text-white font-semibold">{formatUSD(amount, locale)}</span>{' '}
									{dict.calculator.mappingMiddle}{' '}
									<span className="text-amber-300 font-semibold">{nftCountDisplay}</span>
									{dict.calculator.mappingSuffix}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
			<div className="mt-1 text-xl sm:text-2xl font-bold text-white tabular-nums">{value}</div>
		</div>
	);
}
