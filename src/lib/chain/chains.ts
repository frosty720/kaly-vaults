import { defineChain } from 'viem';

/**
 * KalyChain after the KMT relaunch: ONE chain, id 3890, native token KMT.
 * There is no testnet/mainnet switch any more — the old mainnet fleet is gone and the former
 * testnet fleet became 3890. The hostnames still say "testnet" until DNS cuts over.
 *
 * CUT DAY: set NEXT_PUBLIC_RPC_URL + NEXT_PUBLIC_EXPLORER_URL on the server and rebuild —
 * nothing else in the app hardcodes a KalyChain host (see chains.test.ts and the migration guard test).
 */
export const KALYCHAIN_CHAIN_ID = 3890;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainrpc.kalychain.io/rpc';
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://testnet.kalyscan.io';

export const NATIVE_SYMBOL = 'KMT';
export const WRAPPED_NATIVE_SYMBOL = 'WKMT';
export const NATIVE_CURRENCY = { name: 'KalyChain Monetary Token', symbol: NATIVE_SYMBOL, decimals: 18 } as const;

export const kalychain = defineChain({
	id: KALYCHAIN_CHAIN_ID,
	name: 'KalyChain',
	nativeCurrency: NATIVE_CURRENCY,
	rpcUrls: { default: { http: [RPC_URL] } },
	blockExplorers: { default: { name: 'KalyScan', url: EXPLORER_URL } },
});

/** Namespace for react-query keys — one chain, but keep the keys explicit. */
export const CHAIN_KEY = `kalychain-${KALYCHAIN_CHAIN_ID}`;

export const explorerTx = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddress = (address: string) => `${EXPLORER_URL}/address/${address}`;
