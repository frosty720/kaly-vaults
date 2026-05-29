'use client';

import * as Slider from '@radix-ui/react-slider';
import { BASE_KLC_PRICE } from '@/lib/tiers';
import { formatUSD } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface PriceSliderProps {
	multiplier: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	dict: Dictionary;
	locale: Locale;
	/** Live KLC/USD base price; falls back to the hardcoded constant. */
	klcPrice?: number;
}

export function PriceSlider({
	multiplier,
	onChange,
	min = 1,
	max = 20,
	dict,
	locale,
	klcPrice = BASE_KLC_PRICE,
}: PriceSliderProps) {
	const presets = [1, 2, 5, 10, 20];
	const currentPrice = klcPrice * multiplier;

	return (
		<div>
			<div className="flex items-end justify-between gap-4 flex-wrap">
				<div>
					<div className="text-xs uppercase tracking-wider text-amber-300/80 font-medium">
						{dict.calculator.klcPriceScenario}
					</div>
					<div className="mt-1 flex items-baseline gap-3">
						<span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
							{formatUSD(currentPrice, locale, { decimals: 4 })}
						</span>
						<span className="text-sm text-white/60">
							{multiplier === 1
								? dict.calculator.priceToday
								: `${multiplier}${dict.calculator.priceTimesToday}`}
						</span>
					</div>
				</div>
				<div className="flex gap-1.5 flex-wrap">
					{presets.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => onChange(p)}
							className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
								multiplier === p
									? 'bg-amber-500 text-black shadow-md'
									: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
							}`}
						>
							{p}×
						</button>
					))}
				</div>
			</div>

			<Slider.Root
				className="relative flex items-center select-none touch-none w-full h-6 mt-4"
				min={min}
				max={max}
				step={1}
				value={[multiplier]}
				onValueChange={(v) => onChange(v[0])}
				aria-label={dict.calculator.klcPriceScenario}
			>
				<Slider.Track className="vault-slider-track">
					<Slider.Range className="vault-slider-range" />
				</Slider.Track>
				<Slider.Thumb className="vault-slider-thumb" />
			</Slider.Root>

			<div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/40">
				<span>1× ({formatUSD(klcPrice, locale, { decimals: 4 })})</span>
				<span>
					{max}× ({formatUSD(klcPrice * max, locale, { decimals: 3 })})
				</span>
			</div>
		</div>
	);
}
