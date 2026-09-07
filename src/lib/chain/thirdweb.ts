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
import { kalychain, EXPLORER_URL, NATIVE_CURRENCY } from './chains';
import { ADDRESSES } from './addresses';

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
// client id still works for injected wallets. name/nativeCurrency/icon make the
// wallet UI show "KalyChain" + the logo instead of generic placeholders.
// Logos served from our own /public/tokens (no remote traffic). thirdweb needs an ABSOLUTE
// URL (it won't resolve a relative path), so prefix with the app origin at runtime — these
// icons only render client-side, where window.location.origin is the live host.
const TOK_BASE = (typeof window !== 'undefined' ? window.location.origin : '') + '/tokens/';
// The KMT logo is the KalyChain mark (same artwork as before the relaunch; file kept as klc.png).
const NATIVE_ICON = { url: TOK_BASE + 'klc.png', width: 64, height: 64, format: 'png' };

export const twKalychain = twDefineChain({
	id: kalychain.id,
	name: kalychain.name,
	rpc: kalychain.rpcUrls.default.http[0],
	nativeCurrency: NATIVE_CURRENCY,
	icon: NATIVE_ICON,
	blockExplorers: [{ name: 'KalyScan', url: EXPLORER_URL }],
});

/**
 * Tokens shown in the in-app wallet's "View Assets" (keyed by chainId). Native KMT is
 * always shown automatically; this lists the ecosystem ERC-20s with their logos.
 * Addresses: kalychain-ops/files/kmt-3890/addresses.json (tokens + kusd.core.Kusd).
 */
export const SUPPORTED_TOKENS: Record<number, { address: string; name: string; symbol: string; icon: string }[]> = {
	[kalychain.id]: [
		{ address: ADDRESSES.wrappedNative, name: 'Wrapped KMT', symbol: 'WKMT', icon: TOK_BASE + 'klc.png' },
		{ address: ADDRESSES.stables.USDT.address, name: 'Tether USD', symbol: 'USDT', icon: TOK_BASE + 'usdt.png' },
		{ address: '0xf00A4b733093C21b0892eae0578F0a926f9370b3', name: 'USD Coin', symbol: 'USDC', icon: TOK_BASE + 'usdc.png' },
		{ address: '0x8fbff791fCcF596DEf2e788549d0275557F95A21', name: 'DAI Token', symbol: 'DAI', icon: TOK_BASE + 'dai.png' },
		{ address: '0xE3f1A8Af16d2Dcd0B6F1F813C449375f85C9d97F', name: 'Wrapped BTC', symbol: 'WBTC', icon: TOK_BASE + 'wbtc.png' },
		{ address: '0x73b8fBACFF08DafD9a0a6cB8699C64a488d9EA2a', name: 'Ether', symbol: 'ETH', icon: TOK_BASE + 'eth.png' },
		{ address: '0xFDb3307a16442ed5A7C040AE1600a3B3D3C8e7D9', name: 'KUSD Stablecoin', symbol: 'KUSD', icon: TOK_BASE + 'kusd.png' },
	],
};

export const twActiveChain = twKalychain;
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
