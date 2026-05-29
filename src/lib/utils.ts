import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Locale } from '@/i18n/config';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const NUMBER_LOCALE: Record<Locale, string> = {
	en: 'en-US',
	fr: 'fr-FR',
};

export function formatUSD(
	value: number,
	locale: Locale = 'en',
	opts?: { compact?: boolean; decimals?: number },
) {
	const numLocale = NUMBER_LOCALE[locale];
	const decimals = opts?.decimals ?? 0;
	if (opts?.compact && Math.abs(value) >= 1000) {
		// Pin both min and max fraction digits so server (Node Intl) and client (browser Intl)
		// produce identical output.
		return new Intl.NumberFormat(numLocale, {
			notation: 'compact',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
			style: 'currency',
			currency: 'USD',
		}).format(value);
	}
	return new Intl.NumberFormat(numLocale, {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
}

const BREAKEVEN_UNIT: Record<Locale, string> = {
	en: 'mo',
	fr: 'mois',
};

export function formatBreakeven(months: number, locale: Locale = 'en') {
	if (!isFinite(months) || months <= 0) return '—';
	const unit = BREAKEVEN_UNIT[locale];
	if (months < 2) return `${months.toFixed(1)} ${unit}`;
	return `${Math.round(months)} ${unit}`;
}

/**
 * Replace `{key}` tokens in a template with values from `vars`.
 * Used for i18n strings so we can keep translations as plain strings
 * (functions can't cross the server/client boundary in React Server Components).
 */
export function interpolate(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, k) => {
		const v = vars[k];
		return v === undefined ? `{${k}}` : String(v);
	});
}
