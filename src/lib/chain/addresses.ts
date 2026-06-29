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
	// All VaultManager addresses that have ever emitted PolDeployed for this treasury.
	// Used to build the complete sparkline history across contract migrations.
	polSources: `0x${string}`[];
	// Earliest block to scan for PolDeployed across ALL polSources (the OLD VaultManager's
	// first deployments predate the new stack's deployBlock, so the sparkline needs a lower floor).
	polDeployBlock: bigint;
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
		DAI:  { address: '0x1e7B8b36b703dDdAAe1bCfedF7BB3876D87b35F3', decimals: 18, pool: '0xFA235E914C79EC20CAB660dED9ab23EaA46fe583' },
		USDC: { address: '0x148d19609F3Ad595F8455225510f89cF0F121013', decimals: 6,  pool: '0x86Cc2Bf4A68dfA9A7725170808205ae26c586142' },
	},
	// v4 stack (80/20 + 3-level MLM + 8 packs + PolLib) deployed ~block 48374000.
	deployBlock: BigInt(48374000),
	// All VaultManagers that have ever deployed POL into the shared treasury (sparkline history).
	polSources: [
		'0xb02f6b79CbB549F188c90f83035dD295d8AdF082', // current v4 stack (80/20 + MLM)
		'0x448daA88363ABF88c70EADdfCb5c07EF5aB63874', // seeded-bootstrap stack
		'0xaA3dA84bE9057E1d712786ff4dA67C0A10364a49', // prior v2 stack (same-tx drip)
		'0xb8D685966E72E5A3e2ebc4be2D0727F7D8494D6C', // earlier v2 stack
		'0xd97A80404990f6a734901e691D13385728A55A1D', // original VaultManager (positions #20–23)
	],
	// oldest VM's first POL deployments were ~47.8M, before any stack's deployBlock
	polDeployBlock: BigInt(47800000),
};

const MAINNET: Addresses = {
	vaultManager: null, rewardsPool: null, wklc: null, positionManager: null, treasury: null,
	stables: {}, deployBlock: BigInt(0),
	polSources: [],
	polDeployBlock: BigInt(0),
};

export function getAddresses(net: NetworkName): Addresses {
	return net === 'mainnet' ? MAINNET : TESTNET;
}
