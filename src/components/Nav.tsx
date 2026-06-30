import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { LangSwitcher } from './LangSwitcher';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface NavProps {
	dict: Dictionary;
	locale: Locale;
	/** When on the dApp page: hide the waitlist CTA and render `rightActions` (the wallet button) instead. */
	appMode?: boolean;
	rightActions?: ReactNode;
}

export function Nav({ dict, locale, appMode = false, rightActions }: NavProps) {
	return (
		<header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#050505]/80 border-b border-white/5">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
				<Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl tracking-tight">
					<Image src="/klc.png" alt="KalyChain logo" width={28} height={28} priority className="rounded-md" />
					<span className="text-amber-500">Kaly</span>
					<span className="text-white">Chain</span>
				</Link>

				<div className="hidden md:flex items-center gap-6 text-sm text-white/70">
					<a href="https://kalychain.io" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
						{dict.nav.ecosystem}
					</a>
					<a href="https://kalyswap.io" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
						{dict.nav.kalyswap}
					</a>
					<a href="https://kusd.kalychain.io/" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
						{dict.nav.kusd}
					</a>
					<a href="https://rails.kalychain.io/" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
						{dict.nav.rails}
					</a>
					<a href="https://docs.kalychain.io" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
						{dict.nav.docs}
					</a>
				</div>

				<div className="flex items-center gap-2">
					<LangSwitcher currentLocale={locale} ariaLabel={dict.langSwitcher.ariaLabel} />
					{appMode ? (
						rightActions
					) : (
						<>
							<Link href={`/${locale}/app`} className="btn-ghost px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
								{dict.nav.launchApp}
							</Link>
							<a href="#waitlist" className="btn-primary px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
								{dict.nav.joinWaitlist}
							</a>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}
