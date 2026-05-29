'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LOCALES, type Locale } from '@/i18n/config';

interface LangSwitcherProps {
	currentLocale: Locale;
	ariaLabel: string;
}

export function LangSwitcher({ currentLocale, ariaLabel }: LangSwitcherProps) {
	const pathname = usePathname();

	// Build the equivalent path for each locale
	function localizedPath(target: Locale): string {
		// Strip the leading /<currentLocale>
		const rest = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '';
		return `/${target}${rest}`;
	}

	return (
		<div
			role="group"
			aria-label={ariaLabel}
			className="inline-flex items-center rounded-md border border-white/10 bg-white/5 backdrop-blur p-0.5"
		>
			{LOCALES.map((l) => {
				const isActive = l === currentLocale;
				return (
					<Link
						key={l}
						href={localizedPath(l)}
						aria-current={isActive ? 'true' : undefined}
						className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
							isActive
								? 'bg-amber-500 text-black shadow-sm'
								: 'text-white/70 hover:text-white'
						}`}
					>
						{l}
					</Link>
				);
			})}
		</div>
	);
}
