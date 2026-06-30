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
// client id still works for injected wallets. name/nativeCurrency/icon make the
// wallet UI show "KalyChain" + the KLC logo instead of generic placeholders.
// Logos served from our own /public/tokens (no remote traffic). thirdweb needs an ABSOLUTE
// URL (it won't resolve a relative path), so prefix with the app origin at runtime — these
// icons only render client-side, where window.location.origin is the live host.
const TOK_BASE = (typeof window !== 'undefined' ? window.location.origin : '') + '/tokens/';
const KLC_ICON = { url: TOK_BASE + 'klc.png', width: 64, height: 64, format: 'png' };
const KLC_NATIVE = { name: 'KalyCoin', symbol: 'KLC', decimals: 18 };
export const twKalyTestnet = twDefineChain({
	id: kalyTestnet.id,
	name: 'KalyChain Testnet',
	rpc: kalyTestnet.rpcUrls.default.http[0],
	nativeCurrency: KLC_NATIVE,
	icon: KLC_ICON,
	blockExplorers: [{ name: 'KalyScan', url: 'https://testnet.kalyscan.io' }],
});
export const twKalyMainnet = twDefineChain({
	id: kalyMainnet.id,
	name: 'KalyChain Mainnet',
	rpc: kalyMainnet.rpcUrls.default.http[0],
	nativeCurrency: KLC_NATIVE,
	icon: KLC_ICON,
	blockExplorers: [{ name: 'KalyScan', url: 'https://kalyscan.io' }],
});

/**
 * Tokens shown in the in-app wallet's "View Assets" (keyed by chainId). Native KLC is
 * always shown automatically; this lists the ecosystem ERC-20s with their logos.
 */
export const SUPPORTED_TOKENS: Record<number, { address: string; name: string; symbol: string; icon: string }[]> = {
	[kalyMainnet.id]: [
		{ address: '0x069255299Bb729399f3CECaBdc73d15d3D10a2A3', name: 'Wrapped KalyCoin', symbol: 'wKLC', icon: TOK_BASE + 'klc.png' },
		{ address: '0xCC93b84cEed74Dc28c746b7697d6fA477ffFf65a', name: 'KalySwap Token', symbol: 'KSWAP', icon: TOK_BASE + 'kswap.png' },
		{ address: '0xCd02480926317748e95c5bBBbb7D1070b2327f1A', name: 'KUSD Stablecoin', symbol: 'KUSD', icon: TOK_BASE + 'kusd.png' },
		{ address: '0x2CA775C77B922A51FcF3097F52bFFdbc0250D99A', name: 'Tether USD', symbol: 'USDT', icon: TOK_BASE + 'usdt.png' },
		{ address: '0x9cAb0c396cF0F4325913f2269a0b72BD4d46E3A9', name: 'USD Coin', symbol: 'USDC', icon: TOK_BASE + 'usdc.png' },
		{ address: '0x6E92CAC380F7A7B86f4163fad0df2F277B16Edc6', name: 'DAI Token', symbol: 'DAI', icon: TOK_BASE + 'dai.png' },
		{ address: '0xaA77D4a26d432B82DB07F8a47B7f7F623fd92455', name: 'Wrapped BTC', symbol: 'WBTC', icon: TOK_BASE + 'wbtc.png' },
		{ address: '0xfdbB253753dDE60b11211B169dC872AaE672879b', name: 'Ether', symbol: 'ETH', icon: TOK_BASE + 'eth.png' },
		{ address: '0x0e2318b62a096AC68ad2D7F37592CBf0cA9c4Ddb', name: 'Binance', symbol: 'BNB', icon: TOK_BASE + 'bnb.png' },
		{ address: '0x706C9a63d7c8b7Aaf85DDCca52654645f470E8Ac', name: 'Polygon', symbol: 'POL', icon: TOK_BASE + 'pol.png' },
		{ address: '0xdbba43d094bc683f7420d4b5a44cd9d6bf4f1773', name: 'KNETWORK', symbol: 'KNT', icon: TOK_BASE + 'knt.png' },
	],
	[kalyTestnet.id]: [
		{ address: '0xd15F19c457AaaCB7A389B305Dac8611Cd2294c36', name: 'KUSD Stablecoin', symbol: 'KUSD', icon: TOK_BASE + 'kusd.png' },
		{ address: '0x6Fdb0fEd277b878a0d80494b06EA054C99d2fdD2', name: 'Tether USD', symbol: 'USDT', icon: TOK_BASE + 'usdt.png' },
	],
};

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
