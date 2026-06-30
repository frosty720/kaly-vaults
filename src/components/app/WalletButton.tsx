'use client';

import { ConnectButton, darkTheme } from 'thirdweb/react';
import { thirdwebClient, thirdwebChains, twActiveChain, allWallets } from '@/lib/chain/thirdweb';

// Brand the thirdweb modal + button to the vault's amber-on-black system.
const vaultTheme = darkTheme({
	colors: {
		modalBg: '#0a0a0a',
		borderColor: 'rgba(245, 158, 11, 0.25)',
		accentText: '#f59e0b',
		accentButtonBg: '#f59e0b',
		accentButtonText: '#0a0a0a',
		primaryButtonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
		primaryButtonText: '#ffffff',
		secondaryButtonBg: 'rgba(255,255,255,0.06)',
		primaryText: '#ffffff',
		secondaryText: '#a8a29e',
	},
});

/**
 * Shared connect/account button. `compact` renders a tighter modal (used in the
 * header); the default is used for the standalone connect prompt.
 */
export function WalletButton({ compact = false, label = 'Connect Wallet' }: { compact?: boolean; label?: string }) {
	return (
		<ConnectButton
			client={thirdwebClient}
			wallets={allWallets}
			chains={thirdwebChains}
			chain={twActiveChain}
			theme={vaultTheme}
			connectButton={{ label }}
			connectModal={{
				title: 'Connect to Kaly Vaults',
				size: compact ? 'compact' : 'wide',
				showThirdwebBranding: false,
			}}
		/>
	);
}
