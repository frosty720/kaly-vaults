'use client';

import { useState } from 'react';
import { Hero } from './Hero';
import { InvestmentCalculator } from './InvestmentCalculator';
import { VaultFlow } from './VaultFlow';
import { TierCards } from './TierCards';
import { ScalingCallout } from './ScalingCallout';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface LandingPageProps {
	dict: Dictionary;
	locale: Locale;
	kmtPrice: number;
	/** Live VaultManager.paused(); null when unknown. */
	salesPaused: boolean | null;
}

export function LandingPage({ dict, locale, kmtPrice, salesPaused }: LandingPageProps) {
	const [priceMultiplier, setPriceMultiplier] = useState(1);

	return (
		<>
			<Hero dict={dict} salesPaused={salesPaused} />
			<InvestmentCalculator
				priceMultiplier={priceMultiplier}
				onPriceMultiplierChange={setPriceMultiplier}
				dict={dict}
				locale={locale}
				kmtPrice={kmtPrice}
			/>
			<VaultFlow dict={dict} locale={locale} />
			<TierCards priceMultiplier={priceMultiplier} dict={dict} locale={locale} />
			<ScalingCallout dict={dict} locale={locale} kmtPrice={kmtPrice} />
		</>
	);
}
