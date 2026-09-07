/**
 * Every address the dApp touches on KalyChain 3890. Copied from
 * kalychain-ops/files/kmt-3890/addresses.json — addresses.test.ts asserts they stay in sync.
 */
export interface StableInfo { address: `0x${string}`; decimals: number; pool: `0x${string}` }
export interface Addresses {
	vaultManager: `0x${string}`;
	rewardsPool: `0x${string}`;
	/** WKMT — the WETH9-equivalent the VaultManager pairs POL against (its ABI still calls it `wklc`). */
	wrappedNative: `0x${string}`;
	positionManager: `0x${string}`;
	/** DAO Treasury — owner of every POL position; usePolStats values ITS positions only. */
	treasury: `0x${string}`;
	/** Stables the VaultManager accepts (`stables(addr).enabled`). USDT only at launch. */
	stables: Record<string, StableInfo>;
	/** First block of the v5 deployment (4581–4620); event scans start here. */
	deployBlock: bigint;
}

export const ADDRESSES: Addresses = {
	vaultManager: '0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982',
	rewardsPool: '0x82eeCEcF8C3bbD94A3A11Abe04Ce3F49BbA35E52',
	wrappedNative: '0xf90F0Bd56558Ac12F7FC285571D38181d2feD69b',
	positionManager: '0xCa4a8fC696ADAE8edC042cB9E32Cd7F0A28EBdf0',
	treasury: '0xDF8CFefEa7DaA5E5B23c262A461aCcA6356BCA90',
	stables: {
		USDT: { address: '0x6318EcDbae6B469D39C38949eDC671f4bA8A6172', decimals: 6, pool: '0xa9Ac6D3c75A883Cc5D6EfE7EbB973c68174bA61F' },
	},
	deployBlock: BigInt(4581),
};

export function getAddresses(): Addresses {
	return ADDRESSES;
}
