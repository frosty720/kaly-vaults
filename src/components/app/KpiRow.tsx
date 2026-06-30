'use client';

import { usePolStats, useProtocolStats } from '@/lib/chain/reads';
import { fmtUsd } from '@/lib/format';
import { StatCard } from './StatCard';
import { AnimatedNumber } from './AnimatedNumber';
import type { Dictionary } from '@/i18n/dictionaries/en';

const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export function KpiRow({ t }: { t: Dictionary['app']['kpi'] }) {
	const pol = usePolStats();
	const stats = useProtocolStats();

	const aprLabel = (() => {
		if (!stats.data) return '—';
		const { aprMinPct, aprMaxPct } = stats.data;
		if (aprMaxPct === 0) return '—';
		return aprMinPct === aprMaxPct ? `${aprMaxPct}%` : `${aprMinPct}–${aprMaxPct}%`;
	})();

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<StatCard
				label={t.polLabel}
				loading={pol.isLoading}
				error={pol.isError}
				delayMs={60}
				value={<AnimatedNumber value={pol.data?.totalUsd ?? 0} format={fmtUsd} />}
				sub={t.polSub}
			/>
			<StatCard
				label={t.depositedLabel}
				loading={stats.isLoading}
				error={stats.isError}
				delayMs={120}
				value={<AnimatedNumber value={stats.data?.totalDepositedUsd ?? 0} format={fmtUsd} />}
				sub={t.depositedSub}
			/>
			<StatCard
				label={t.mintedLabel}
				loading={stats.isLoading}
				error={stats.isError}
				delayMs={180}
				value={<AnimatedNumber value={stats.data?.vaultsMinted ?? 0} format={fmtInt} />}
				sub={t.mintedSub}
			/>
			<StatCard
				label={t.aprLabel}
				loading={stats.isLoading}
				error={stats.isError}
				delayMs={240}
				value={aprLabel}
				sub={t.aprSub}
			/>
		</div>
	);
}
