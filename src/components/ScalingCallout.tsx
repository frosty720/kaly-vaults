import { Zap } from 'lucide-react';
import { BASE_KLC_PRICE, project, tierByKey } from '@/lib/tiers';
import { formatUSD, interpolate } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface ScalingCalloutProps {
	dict: Dictionary;
	locale: Locale;
	/** Live KLC/USD base price; falls back to the hardcoded constant. */
	klcPrice?: number;
}

export function ScalingCallout({ dict, locale, klcPrice = BASE_KLC_PRICE }: ScalingCalloutProps) {
	const genesis = tierByKey('whale100k');
	const at2x = project({ investmentUsd: genesis.price, baseApr: genesis.baseApr, priceMultiplier: 2 });
	const at5x = project({ investmentUsd: genesis.price, baseApr: genesis.baseApr, priceMultiplier: 5 });
	const at10x = project({ investmentUsd: genesis.price, baseApr: genesis.baseApr, priceMultiplier: 10 });

	return (
		<section className="py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="glass rounded-2xl p-6 sm:p-8 flex items-start gap-4 sm:gap-5">
					<div className="shrink-0 mt-1 w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center border border-amber-500/30">
						<Zap className="w-5 h-5 text-amber-400" aria-hidden />
					</div>
					<div className="text-sm sm:text-base text-white/80 leading-relaxed">
						<span className="text-white font-semibold">{dict.scaling.boldLead}</span>{' '}
						{interpolate(dict.scaling.body, {
							todayPrice: formatUSD(klcPrice, locale, { decimals: 4 }),
						})}{' '}
						<span className="text-amber-300 font-semibold">
							{interpolate(dict.scaling.at2x, {
								val: formatUSD(at2x.annualUsd, locale, { decimals: 0 }),
							})}
						</span>{' '}
						<span className="text-amber-400 font-semibold">
							{interpolate(dict.scaling.at5x, {
								val: formatUSD(at5x.annualUsd, locale, { decimals: 0 }),
							})}
						</span>{' '}
						<span className="text-amber-500 font-semibold">
							{interpolate(dict.scaling.at10x, {
								val: formatUSD(at10x.annualUsd, locale, { decimals: 0 }),
							})}
						</span>{' '}
						{dict.scaling.floor}
					</div>
				</div>
			</div>
		</section>
	);
}
