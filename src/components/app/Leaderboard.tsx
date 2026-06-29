'use client';

import { useLeaderboard } from '@/lib/chain/reads';
import { formatUSD } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';

interface Props {
	locale: Locale;
	you?: `0x${string}`;
	t: Dictionary['app']['leaderboard'];
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function Leaderboard({ locale, you, t }: Props) {
	const { data, isLoading, isError } = useLeaderboard();
	const me = you?.toLowerCase();

	return (
		<section className="glass rounded-2xl p-6 sm:p-8 fade-up">
			<span className="text-xs uppercase tracking-[0.18em] font-semibold text-amber-300/80">{t.title}</span>

			{isLoading && <div className="mt-5 space-y-2"><Skeleton className="h-9" /><Skeleton className="h-9" /><Skeleton className="h-9" /></div>}
			{isError && !isLoading && <p className="mt-4 text-sm text-danger">{t.error}</p>}

			{!isLoading && !isError && data && data.length === 0 && (
				<p className="mt-4 text-sm text-white/45">{t.empty}</p>
			)}

			{!isLoading && !isError && data && data.length > 0 && (
				<div className="mt-5 overflow-hidden rounded-xl border border-white/5">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-white/40">
								<th className="px-3 py-2 text-left font-medium">#</th>
								<th className="px-3 py-2 text-left font-medium">{t.affiliate}</th>
								<th className="px-3 py-2 text-right font-medium">{t.referrals}</th>
								<th className="px-3 py-2 text-right font-medium">{t.commission}</th>
							</tr>
						</thead>
						<tbody>
							{data.map((row, i) => {
								const isMe = me && row.address === me;
								return (
									<tr key={row.address} className={`border-t border-white/5 ${isMe ? 'bg-amber-500/10' : ''}`}>
										<td className="px-3 py-2 tabular-nums text-white/50">{i + 1}</td>
										<td className="px-3 py-2 tabular-nums text-white/80">
											{short(row.address)}{isMe && <span className="ml-1.5 text-[10px] text-amber-300">{t.you}</span>}
										</td>
										<td className="px-3 py-2 text-right tabular-nums text-white/70">{row.referrals}</td>
										<td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-300">{formatUSD(row.commissionUsd, locale, { decimals: 2 })}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<p className="mt-4 text-[11px] text-white/30 leading-relaxed">{t.footnote}</p>
		</section>
	);
}
