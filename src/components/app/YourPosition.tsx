'use client';

import { useClaimable, useKlcPrice, useVaults } from '@/lib/chain/reads';
import { useClaim } from '@/lib/chain/writes';
import { TIERS } from '@/lib/tiers';
import { fmtUsd, fmtKlc } from '@/lib/format';
import { Skeleton } from './Skeleton';
import { LiveBadge } from './LiveBadge';
import type { Dictionary } from '@/i18n/dictionaries/en';

interface YourPositionProps {
	addr: `0x${string}`;
	t: Dictionary['app']['position'];
	liveLabel: string;
}

export function YourPosition({ addr, t, liveLabel }: YourPositionProps) {
	const claimable = useClaimable(addr);
	const { data: klcPrice } = useKlcPrice();
	const vaults = useVaults(addr);
	const { claim, isPending } = useClaim();

	// v2: claimable.data is { totalClaimableKlc, ids } or undefined
	const claimableKlc =
		claimable.data !== undefined ? Number(claimable.data.totalClaimableKlc) / 1e18 : undefined;
	const claimableUsd =
		claimableKlc !== undefined && klcPrice !== undefined
			? claimableKlc * klcPrice
			: undefined;

	const ids = claimable.data?.ids ?? [];
	const isZero = claimableKlc !== undefined && claimableKlc === 0;

	async function handleClaim() {
		await claim(ids);
		await claimable.refetch();
	}

	// Summary stats from vaults
	const invested = (() => {
		if (!vaults.data) return undefined;
		return vaults.data.reduce((sum, v) => sum + (TIERS[v.tier]?.price ?? 0), 0);
	})();

	const totalWeight = (() => {
		if (!vaults.data) return undefined;
		return vaults.data.reduce((sum, v) => sum + v.weight, 0n);
	})();

	return (
		<div className="glass rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-amber-500/[0.06] to-transparent space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs uppercase tracking-[0.18em] font-semibold text-amber-300/80">
					{t.title}
				</span>
				<LiveBadge updatedLabel={liveLabel} />
			</div>

			{/* Claimable rewards */}
			<div className="space-y-2">
				<p className="text-sm text-white/50">{t.claimableNow}</p>

				{claimable.isLoading ? (
					<Skeleton className="h-12 w-48" />
				) : claimable.isError ? (
					<p className="text-sm text-danger">{t.error}</p>
				) : (
					<>
						<div className="text-4xl font-bold text-white tabular-nums font-mono">
							{fmtKlc(claimableKlc ?? 0)}
						</div>
						{claimableUsd !== undefined ? (
							<p className="text-sm text-white/50">
								≈ <span className="tabular-nums">{fmtUsd(claimableUsd)}</span>
							</p>
						) : claimableKlc !== undefined ? (
							<p className="text-xs text-white/40">{t.priceUnavailable}</p>
						) : null}
					</>
				)}
			</div>

			{/* Claim button — claimMany(ids) across all owned vaults */}
			<button
				type="button"
				onClick={handleClaim}
				disabled={isPending || isZero || ids.length === 0 || claimable.isLoading || claimable.isError}
				className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold"
			>
				{isPending ? t.claiming : t.claim}
			</button>

			{/* Summary mini-cards */}
			<div className="grid grid-cols-2 gap-3">
				<MiniCard
					label={t.invested}
					value={
						vaults.isLoading ? null :
						vaults.isError ? '—' :
						invested !== undefined ? fmtUsd(invested) : fmtUsd(0)
					}
				/>
				<MiniCard
					label={t.weight}
					value={
						vaults.isLoading ? null :
						vaults.isError ? '—' :
						totalWeight !== undefined ? totalWeight.toLocaleString() : '0'
					}
				/>
			</div>
		</div>
	);
}

interface MiniCardProps {
	label: string;
	value: string | null;
}

function MiniCard({ label, value }: MiniCardProps) {
	return (
		<div className="glass rounded-xl p-4 space-y-1.5">
			<p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>
			{value === null ? (
				<Skeleton className="h-5 w-20" />
			) : (
				<p className="text-base font-bold text-white tabular-nums font-mono">{value}</p>
			)}
		</div>
	);
}
