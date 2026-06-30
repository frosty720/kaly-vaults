'use client';

/**
 * Thirdweb SDK configuration — mirrors the KalySwap setup so users share ONE
 * wallet across both apps. The in-app wallet address is derived from the login
 * identity (email/social/passkey) under a given client id, so using the SAME
 * NEXT_PUBLIC_THIRDWEB_CLIENT_ID as KalySwap means the same email logs into the
 * same wallet on both sites.
 *
 * Wagmi still drives every contract read/write — see thirdwebBridge.ts, which
 * wraps the connected thirdweb wallet as a wagmi connector.
 */

import { createThirdwebClient, defineChain as twDefineChain } from 'thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { kalyMainnet, kalyTestnet, ACTIVE_NETWORK } from './chains';

// createThirdwebClient throws on an empty clientId. Fall back to a placeholder so
// the module never crashes the page before the real key is set; injected wallets
// (MetaMask etc.) still work because our chains below use an explicit RPC and the
// wallet itself signs. The in-app (email/social) wallet REQUIRES the real key.
const CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'MISSING_THIRDWEB_CLIENT_ID';

if (CLIENT_ID === 'MISSING_THIRDWEB_CLIENT_ID' && typeof window !== 'undefined') {
	console.warn(
		'[kaly-vault] NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Injected wallets (MetaMask) work, ' +
			'but the email/social in-app wallet is disabled until you add the key (reuse KalySwap’s).',
	);
}

export const thirdwebClient = createThirdwebClient({ clientId: CLIENT_ID });

// Thirdweb chains use a single explicit RPC (not viem's fallback array). Pointing
// at our own endpoint keeps reads/writes off thirdweb's edge so a placeholder
// client id still works for injected wallets.
export const twKalyTestnet = twDefineChain({
	id: kalyTestnet.id,
	rpc: kalyTestnet.rpcUrls.default.http[0],
});
export const twKalyMainnet = twDefineChain({
	id: kalyMainnet.id,
	rpc: kalyMainnet.rpcUrls.default.http[0],
});

export const twActiveChain = ACTIVE_NETWORK === 'mainnet' ? twKalyMainnet : twKalyTestnet;
export const thirdwebChains = [twActiveChain];

/** In-app wallet: email / social / passkey login. Same auth set as KalySwap. */
export const vaultInAppWallet = inAppWallet({
	auth: {
		options: ['email', 'google', 'apple', 'passkey', 'phone'],
		mode: 'popup',
	},
});

/** External wallets, surfaced after the in-app option. */
export const externalWallets = [
	createWallet('io.metamask'),
	createWallet('com.coinbase.wallet'),
	createWallet('io.rabby'),
];

/** In-app wallet first (the shared-login path), then external, then WalletConnect. */
export const allWallets = [vaultInAppWallet, ...externalWallets, createWallet('walletConnect')];
