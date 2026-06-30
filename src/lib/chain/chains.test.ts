import { describe, it, expect } from 'vitest';
import { kalyTestnet, kalyMainnet, activeChain } from './chains';

describe('chains', () => {
	it('testnet has the right id, rpc, native KLC', () => {
		expect(kalyTestnet.id).toBe(3889);
		expect(kalyTestnet.nativeCurrency.symbol).toBe('KLC');
		expect(kalyTestnet.rpcUrls.default.http[0]).toContain('testnetrpc.kalychain.io');
	});
	it('mainnet id is 3888', () => { expect(kalyMainnet.id).toBe(3888); });
	it('activeChain resolves from NEXT_PUBLIC_CHAIN', () => {
		expect(activeChain('mainnet').id).toBe(3888);
		expect(activeChain('testnet').id).toBe(3889);
		expect(activeChain(undefined).id).toBe(3889);
	});
});
