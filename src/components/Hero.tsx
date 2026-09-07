import type { Dictionary } from '@/i18n/dictionaries/en';
import { BLOCK_REWARD_KMT, BLOCKS_PER_DAY, TIERS } from '@/lib/tiers';
import { NATIVE_SYMBOL } from '@/lib/chain/chains';

interface HeroProps {
	dict: Dictionary;
	/** VaultManager.paused() read server-side; null when the chain couldn't be read. */
	salesPaused: boolean | null;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function Hero({ dict, salesPaused }: HeroProps) {
	// Every figure here is a protocol constant or the tier table the contract was configured from.
	const aprs = TIERS.map((t) => t.baseApr);
	const stats = [
		{ value: BLOCKS_PER_DAY.toLocaleString('en-US'), label: dict.hero.stats.blocksPerDay },
		{ value: `${BLOCK_REWARD_KMT} ${NATIVE_SYMBOL}`, label: dict.hero.stats.rewardPerBlock },
		{ value: `${pct(Math.min(...aprs))}–${pct(Math.max(...aprs))}`, label: dict.hero.stats.aprRange },
		{ value: dict.hero.stats.tiersValue, label: dict.hero.stats.tiers },
	];

	const badge = salesPaused ? dict.hero.badgePaused : salesPaused === false ? dict.hero.badgeLive : dict.hero.badge;
	const subhead = salesPaused ? dict.hero.subheadPaused : dict.hero.subhead;

	return (
		<section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wider uppercase">
					<span className="pulse-dot" aria-hidden />
					{badge}
				</div>

				<h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white max-w-4xl">
					{dict.hero.headlineBefore}{' '}
					<span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
						{dict.hero.headlineAccent}
					</span>{' '}
					{dict.hero.headlineAfter}
				</h1>

				<p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
					{subhead}
				</p>

				<div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl">
					{stats.map((s) => (
						<div key={s.label} className="glass rounded-xl p-4 sm:p-5">
							<div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{s.value}</div>
							<div className="mt-1 text-xs sm:text-sm text-white/60">{s.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
