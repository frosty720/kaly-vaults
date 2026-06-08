import type { Dictionary } from '@/i18n/dictionaries/en';
import { Countdown } from './Countdown';

interface HeroProps {
	dict: Dictionary;
}

export function Hero({ dict }: HeroProps) {
	const stats = [
		{ value: '43,200', label: dict.hero.stats.blocksPerDay },
		{ value: '3 KLC', label: dict.hero.stats.rewardPerBlock },
		{ value: '15–35%', label: dict.hero.stats.aprRange },
		{ value: dict.hero.stats.tiersValue, label: dict.hero.stats.tiers },
	];

	return (
		<section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wider uppercase">
					<span className="pulse-dot" aria-hidden />
					{dict.hero.badge}
				</div>

				<div className="mt-8">
					<Countdown dict={dict} />
				</div>

				<h1 className="mt-8 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white max-w-4xl">
					{dict.hero.headlineBefore}{' '}
					<span className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 bg-clip-text text-transparent">
						{dict.hero.headlineAccent}
					</span>{' '}
					{dict.hero.headlineAfter}
				</h1>

				<p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed">
					{dict.hero.subhead}
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
