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
	it('mainnet returns the deployed v4 proxies + USDT/KUSD stables', () => {
		const a = getAddresses('mainnet');
		expect(a.vaultManager).toBe('0x8ad3aD4a3F20672d39F6F87d6bdf1DF5386ac6A5');
		expect(a.rewardsPool).toBe('0x8b80800Cf6dA88D59EB09CaE4Fd2196423c48b26');
		expect(a.treasury).toBe('0x92564ec0d22BBd5e3FF978B977CA968e6c7d1c44');
		expect(Object.keys(a.stables)).toEqual(['KUSD', 'USDT']);
		expect(a.stables.USDT.decimals).toBe(6);
		expect(a.stables.KUSD.decimals).toBe(18);
		expect(a.deployBlock).toBe(51187545n);
	});
});
