'use client';

import { useState } from 'react';
import { TIERS } from '@/lib/tiers';
import { fmtUsd } from '@/lib/format';
import { interpolate } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';
import { BuyModal } from './BuyModal';

interface BuySectionProps {
	addr?: `0x${string}`;
	onPurchased?: () => void;
	/** Called when a tier is clicked but no wallet is connected. */
	onNeedConnect?: () => void;
	t: Dictionary['app']['buy'];
	tModal: Dictionary['app']['modal'];
	locale: Locale;
}

export function BuySection({ addr, onPurchased, onNeedConnect, t, tModal, locale: _locale }: BuySectionProps) {
	const [openTierIndex, setOpenTierIndex] = useState<number | null>(null);

	function handleTierClick(index: number) {
		if (addr) setOpenTierIndex(index);
		else onNeedConnect?.();
	}

	return (
		<section className="space-y-5">
			<div className="flex items-end justify-between gap-3">
				<h2 className="text-lg font-bold text-white">
					{t.headingBefore} <span className="text-amber-400">{t.headingAccent}</span>
				</h2>
				<span className="text-xs text-white/40">{t.subtitle}</span>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{TIERS.map((tier, index) => {
					const featured = tier.featured;
					return (
						<button
							key={tier.key}
							type="button"
							onClick={() => handleTierClick(index)}
							className={`tier-card fade-up text-left p-5 flex flex-col gap-4 ${
								featured ? 'tier-card-featured' : ''
							}`}
							style={{ animationDelay: `${index * 70}ms` }}
						>
							<div className="flex items-center justify-between">
								<span className="text-xs uppercase tracking-[0.16em] font-semibold text-amber-300/80">
									{tier.name}
								</span>
								{featured && (
									<span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
										{t.popular}
									</span>
								)}
							</div>

							<div>
								<div className="text-3xl font-bold text-white tabular-nums font-mono leading-none">
									{fmtUsd(tier.price)}
								</div>
								<div className="mt-2 inline-flex items-center gap-1.5">
									<span
										className="inline-block h-1.5 w-1.5 rounded-full"
										style={{ background: tier.accent }}
									/>
									<span className="text-sm font-semibold text-amber-300 tabular-nums">
										{(tier.baseApr * 100).toFixed(0)}% {t.aprSuffix}
									</span>
								</div>
							</div>

							<p className="text-xs text-white/45">{tier.audience}</p>

							<span className="mt-auto inline-flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:border-amber-500/40">
								{addr ? interpolate(t.buyTier, { name: tier.name }) : t.connectToBuy}
							</span>
						</button>
					);
				})}
			</div>

			{openTierIndex !== null && addr && (
				<BuyModal
					tierIndex={openTierIndex}
					addr={addr}
					onClose={() => setOpenTierIndex(null)}
					onPurchased={() => onPurchased?.()}
					t={tModal}
				/>
			)}
		</section>
	);
}
