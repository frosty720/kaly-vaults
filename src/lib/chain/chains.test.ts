import { describe, it, expect } from 'vitest';
import { kalychain, KALYCHAIN_CHAIN_ID, RPC_URL, EXPLORER_URL, NATIVE_SYMBOL, explorerTx } from './chains';

describe('chains', () => {
	it('is ONE chain: KalyChain 3890 with native KMT', () => {
		expect(KALYCHAIN_CHAIN_ID).toBe(3890);
		expect(kalychain.id).toBe(3890);
		expect(kalychain.nativeCurrency.symbol).toBe('KMT');
		expect(NATIVE_SYMBOL).toBe('KMT');
	});
	it('RPC and explorer flow from the env-backed constants (cut-day switch is env-only)', () => {
		expect(kalychain.rpcUrls.default.http[0]).toBe(RPC_URL);
		expect(kalychain.blockExplorers?.default.url).toBe(EXPLORER_URL);
		expect(RPC_URL).toMatch(/^https:\/\/[a-z0-9.-]*kalychain\.io\/rpc$/);
		expect(explorerTx('0xabc')).toBe(`${EXPLORER_URL}/tx/0xabc`);
	});
});
