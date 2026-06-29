import type { Dictionary } from '@/i18n/dictionaries/en';

interface FooterProps {
	dict: Dictionary;
}

export function Footer({ dict }: FooterProps) {
	return (
		<footer className="mt-auto border-t border-white/5 py-8 sm:py-10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-white/50">
					<div>
						© {new Date().getFullYear()} KalyChain. {dict.footer.copyright}
					</div>
					<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
						<a href="https://kalychain.io" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.website}
						</a>
						<a href="https://x.com/KalyChainEVM" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.twitter}
						</a>
						<a href="https://t.me/KalyChain" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.telegram}
						</a>
						<a href="https://discord.gg/tTe8BmcAks" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.discord}
						</a>
						<a href="https://docs.kalychain.io" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.docs}
						</a>
						<a href="/terms" className="hover:text-amber-400 transition-colors">
							{dict.footer.links.terms}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
