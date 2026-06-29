import type { NetworkName } from './chains';

export interface StableInfo { address: `0x${string}`; decimals: number; pool: `0x${string}` }
export interface Addresses {
	vaultManager: `0x${string}` | null;
	rewardsPool: `0x${string}` | null;
	wklc: `0x${string}` | null;
	positionManager: `0x${string}` | null;
	treasury: `0x${string}` | null;
	stables: Record<string, StableInfo>;
	// NOTE: deployBlock is approximate — confirm the exact block against KalyScan before
	// using it for historical event queries in production.
	deployBlock: bigint;
}

const TESTNET: Addresses = {
	vaultManager: '0xb02f6b79CbB549F188c90f83035dD295d8AdF082',
	rewardsPool: '0x57616e82d871Fc2f89F57352274b5A80940d7A28',
	wklc: '0x069255299Bb729399f3CECaBdc73d15d3D10a2A3',
	positionManager: '0x8064558662896B2941B2BF88eb51182b4152d61B',
	treasury: '0x5aE2cf3fC0B99003C64bBDC7836D08064ED43Aab',
	stables: {
		KUSD: { address: '0xd15F19c457AaaCB7A389B305Dac8611Cd2294c36', decimals: 18, pool: '0x090077817153dF024D115942E656c965674E190c' },
		USDT: { address: '0x6Fdb0fEd277b878a0d80494b06EA054C99d2fdD2', decimals: 6,  pool: '0x4594540BD03928683042E479D4DDF8Ad8705Be5C' },
	},
	// v4 stack (80/20 + 3-level MLM + 8 packs + PolLib) deployed ~block 48374000.
	deployBlock: BigInt(48374000),
};

const MAINNET: Addresses = {
	vaultManager: null, rewardsPool: null, wklc: null, positionManager: null, treasury: null,
	stables: {}, deployBlock: BigInt(0),
};

export function getAddresses(net: NetworkName): Addresses {
	return net === 'mainnet' ? MAINNET : TESTNET;
}
