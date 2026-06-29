'use client';

import { useState } from 'react';
import { useAffiliate, useSponsor } from '@/lib/chain/reads';
import { formatUSD } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface Props {
	addr: `0x${string}`;
	locale: Locale;
	t: Dictionary['app']['affiliate'];
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const ACTIVITY_STYLE: Record<string, string> = {
	active: 'bg-emerald-500/15 text-emerald-300',
	reduced: 'bg-amber-500/15 text-amber-300',
	suspended: 'bg-rose-500/15 text-rose-300',
	none: 'bg-white/10 text-white/50',
};

export function AffiliateDashboard({ addr, locale, t }: Props) {
	const { data, isLoading, isError } = useAffiliate(addr);
	const sponsor = useSponsor(addr);
	const [copied, setCopied] = useState(false);

	// Referral link: this wallet's address is its referral code. ?ref= prefills the buy modal.
	const link = typeof window !== 'undefined'
		? `${window.location.origin}/${locale}/app?ref=${addr}`
		: `…/app?ref=${addr}`;

	async function copy() {
		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch { /* clipboard blocked — user can select manually */ }
	}

	return (
		<section className="glass rounded-2xl p-6 sm:p-8 fade-up">
			<div className="flex items-center justify-between mb-5">
				<span className="text-xs uppercase tracking-[0.18em] font-semibold text-amber-300/80">{t.title}</span>
				{sponsor.data && (
					<span className="text-[11px] text-white/40">{t.sponsoredBy} <span className="text-white/70 tabular-nums">{short(sponsor.data)}</span></span>
				)}
			</div>

			{/* Referral link */}
			<div className="mb-6">
				<label className="text-[11px] uppercase tracking-wider text-white/40">{t.linkLabel}</label>
				<div className="mt-1.5 flex items-stretch gap-2">
					<code className="flex-1 truncate rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-amber-200/80">{link}</code>
					<button
						onClick={copy}
						className="rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition"
					>
						{copied ? t.copied : t.copy}
					</button>
				</div>
			</div>

			{isLoading && <div className="grid grid-cols-3 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}
			{isError && !isLoading && <p className="text-sm text-danger">{t.error}</p>}

			{!isLoading && !isError && data && (
				<>
					<div className="grid grid-cols-3 gap-3">
						<Stat label={t.referrals} value={String(data.directReferrals.length)} />
						<Stat label={t.downline} value={String(data.downlineCount)} />
						<Stat label={t.earned} value={formatUSD(data.commissionUsd, locale, { decimals: 2 })} accent />
					</div>

					{/* Performance rank + progress to next tier */}
					<div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
						<div className="flex items-center justify-between">
							<span className="text-[11px] uppercase tracking-wider text-white/40">{t.rank}</span>
							<span className="text-sm font-semibold text-amber-300">
								{data.rank.current ? `${data.rank.current.name} (+${data.rank.current.bonusPct}%)` : t.noRank}
							</span>
						</div>
						{data.rank.next && (
							<>
								<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
									<div className="h-full rounded-full bg-amber-400/70" style={{ width: `${Math.min(100, (data.sales / data.rank.next.minSales) * 100)}%` }} />
								</div>
								<p className="mt-1.5 text-[11px] text-white/45">
									{t.toNext.replace('{n}', String(data.rank.toNext)).replace('{rank}', data.rank.next.name)}
								</p>
							</>
						)}
						{/* Loyalty multiplier + activity standing */}
						<div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-[11px]">
							<span className="text-white/45">{t.loyalty} <span className="text-white/80 tabular-nums">×{data.loyalty.toFixed(1)}</span></span>
							<span className="flex items-center gap-1.5">
								<span className="text-white/45">{t.activityLabel}</span>
								<span className={`rounded-full px-2 py-0.5 font-semibold ${ACTIVITY_STYLE[data.activity]}`}>{t[`activity_${data.activity}` as const]}</span>
							</span>
						</div>
					</div>

					{/* Per-level commission breakdown */}
					<div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/45">
						<span>N1 <span className="text-white/70 tabular-nums">{formatUSD(data.byLevel.l1, locale, { decimals: 2 })}</span></span>
						<span>N2 <span className="text-white/70 tabular-nums">{formatUSD(data.byLevel.l2, locale, { decimals: 2 })}</span></span>
						<span>N3 <span className="text-white/70 tabular-nums">{formatUSD(data.byLevel.l3, locale, { decimals: 2 })}</span></span>
					</div>

					{/* Direct referrals */}
					{data.directReferrals.length > 0 && (
						<div className="mt-5">
							<p className="text-[11px] uppercase tracking-wider text-white/40 mb-2">{t.yourReferrals}</p>
							<div className="flex flex-wrap gap-2">
								{data.directReferrals.map((r) => (
									<span key={r} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65 tabular-nums">{short(r)}</span>
								))}
							</div>
						</div>
					)}

					<p className="mt-5 text-[11px] text-white/30 leading-relaxed">{t.footnote}</p>
				</>
			)}
		</section>
	);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
			<div className={`text-xl font-bold tabular-nums ${accent ? 'text-amber-300' : 'text-white/90'}`}>{value}</div>
			<div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">{label}</div>
		</div>
	);
}
