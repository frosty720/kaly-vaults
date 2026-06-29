'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from 'thirdweb/react';
import { useQueryClient } from '@tanstack/react-query';
import type { Dictionary } from '@/i18n/dictionaries/en';
import type { Locale } from '@/i18n/config';
import { thirdwebClient, allWallets, thirdwebChains, twActiveChain } from '@/lib/chain/thirdweb';
import { PolHero } from './PolHero';
import { KpiRow } from './KpiRow';
import { YourPosition } from './YourPosition';
import { YourVaults } from './YourVaults';
import { BuySection } from './BuySection';
import { AffiliateDashboard } from './AffiliateDashboard';
import { Leaderboard } from './Leaderboard';
import { ConnectPrompt } from './ConnectPrompt';
import { WalletButton } from './WalletButton';
import { Nav } from '../Nav';

interface VaultAppProps {
	dict: Dictionary;
	locale: Locale;
}

export function VaultApp({ dict, locale }: VaultAppProps) {
	const { address, isConnected } = useAccount();
	const t = dict.app;
	const queryClient = useQueryClient();
	const { connect } = useConnectModal();

	function handlePurchased() {
		queryClient.invalidateQueries({ queryKey: ['vaults'] });
		queryClient.invalidateQueries({ queryKey: ['polStats'] });
		queryClient.invalidateQueries({ queryKey: ['protocolStats'] });
	}

	function openConnect() {
		connect({ client: thirdwebClient, wallets: allWallets, chains: thirdwebChains, chain: twActiveChain });
	}

	const connected = isConnected && !!address;

	return (
		<div className="relative min-h-screen">
			{/* faint grid texture over the page */}
			<div className="pointer-events-none fixed inset-0 grid-texture opacity-40" aria-hidden="true" />

			{/* Shared site header — links back to the landing page, ecosystem, and EN/FR toggle */}
			<Nav
				dict={dict}
				locale={locale}
				appMode
				rightActions={<WalletButton compact label={t.connectWallet} />}
			/>

			<main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
				<div className="space-y-8 sm:space-y-10">
					{/* Public: live protocol view */}
					<PolHero t={t.pol} />
					<KpiRow t={t.kpi} />

					{/* Personal */}
					{connected ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<YourPosition addr={address} t={t.position} liveLabel={t.pol.live} />
							<YourVaults addr={address} t={t.vaults} />
						</div>
					) : (
						<ConnectPrompt t={t.connect} connectLabel={t.connectWallet} />
					)}

					{/* Buy — tiers always visible; click prompts connect if needed */}
					<BuySection
						addr={connected ? address : undefined}
						onPurchased={handlePurchased}
						onNeedConnect={openConnect}
						t={t.buy}
						tModal={t.modal}
						locale={locale}
					/>

					{/* Affiliate: personal dashboard (connected) + public leaderboard */}
					{connected && <AffiliateDashboard addr={address} locale={locale} t={t.affiliate} />}
					<Leaderboard locale={locale} you={connected ? address : undefined} t={t.leaderboard} />
				</div>

				<footer className="mt-16 pt-6 border-t border-white/5 text-center text-[11px] text-white/30">
					{t.footerNote}
				</footer>
			</main>
		</div>
	);
}
