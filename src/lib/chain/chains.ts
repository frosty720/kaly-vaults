import { defineChain } from 'viem';

export const kalyMainnet = defineChain({
	id: 3888,
	name: 'KalyChain',
	nativeCurrency: { name: 'KalyCoin', symbol: 'KLC', decimals: 18 },
	rpcUrls: { default: { http: ['https://rpc.kalychain.io/rpc'] } },
	blockExplorers: { default: { name: 'KalyScan', url: 'https://kalyscan.io' } },
});

export const kalyTestnet = defineChain({
	id: 3889,
	name: 'KalyChain Testnet',
	nativeCurrency: { name: 'KalyCoin', symbol: 'KLC', decimals: 18 },
	rpcUrls: { default: { http: ['https://testnetrpc.kalychain.io/rpc'] } },
	blockExplorers: { default: { name: 'KalyScan Testnet', url: 'https://testnet.kalyscan.io' } },
});

export type NetworkName = 'testnet' | 'mainnet';

export function activeChain(name: string | undefined) {
	return name === 'mainnet' ? kalyMainnet : kalyTestnet;
}

export const ACTIVE_NETWORK: NetworkName =
	process.env.NEXT_PUBLIC_CHAIN === 'mainnet' ? 'mainnet' : 'testnet';
