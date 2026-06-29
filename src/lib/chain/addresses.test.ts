import { describe, it, expect } from 'vitest';
import { getAddresses } from './addresses';

describe('addresses', () => {
	it('testnet returns the v2 deployed proxies + KLC-pair stables', () => {
		const a = getAddresses('testnet');
		expect(a.vaultManager).toBe('0xb02f6b79CbB549F188c90f83035dD295d8AdF082');
		expect(a.rewardsPool).toBe('0x57616e82d871Fc2f89F57352274b5A80940d7A28');
		expect(a.treasury).toBe('0x5aE2cf3fC0B99003C64bBDC7836D08064ED43Aab');
		expect(Object.keys(a.stables)).toEqual(['KUSD', 'USDT']);
		expect(a.stables.USDT.decimals).toBe(6);
		expect(a.stables.KUSD.decimals).toBe(18);
	});
	it('mainnet marks undeployed vault contracts as null', () => {
		const a = getAddresses('mainnet');
		expect(a.vaultManager).toBeNull();
	});
});
