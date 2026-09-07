import { describe, it, expect, afterEach, vi } from 'vitest';
import {
	addChainParams,
	CHAIN_ID_HEX,
	connectToKalyChain,
	currentChainId,
	discoverWallets,
	isOnKalyChain,
	legacyWallets,
	providerErrorCode,
	WALLET_CHAIN_NAME,
	type Eip1193Provider,
} from './cutoverWallet';
import { KALYCHAIN_CHAIN_ID, RPC_URL, EXPLORER_URL } from './chains';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('cutoverWallet', () => {
	it('builds wallet_addEthereumChain params from the single chain config', () => {
		expect(addChainParams()).toEqual({
			chainId: `0x${KALYCHAIN_CHAIN_ID.toString(16)}`,
			chainName: 'KalyChain KMT',
			nativeCurrency: { name: 'KalyChain Monetary Token', symbol: 'KMT', decimals: 18 },
			rpcUrls: [RPC_URL],
			blockExplorerUrls: [EXPLORER_URL],
		});
		expect(CHAIN_ID_HEX).toBe('0xf32');
	});

	it('uses a wallet-facing name distinct from the bare chain name, so a new entry is visible', () => {
		// Users migrating still have an old "KalyChain" network saved; an identically named
		// entry is invisible in the wallet list and they cannot tell it was added.
		expect(WALLET_CHAIN_NAME).toBe('KalyChain KMT');
		expect(addChainParams().chainName).not.toBe('KalyChain');
	});

	it('switches when the wallet already knows the chain', async () => {
		const calls: string[] = [];
		const provider: Eip1193Provider = {
			request: async ({ method }) => {
				calls.push(method);
				return null;
			},
		};
		await expect(connectToKalyChain(provider)).resolves.toBe('switched');
		expect(calls).toEqual(['wallet_switchEthereumChain']);
	});

	it('unknown chain (4902) falls back to add with the derived params', async () => {
		const calls: { method: string; params?: unknown[] }[] = [];
		const provider: Eip1193Provider = {
			request: async (args) => {
				calls.push(args);
				if (args.method === 'wallet_switchEthereumChain') {
					throw Object.assign(new Error('Unrecognized chain ID'), { code: 4902 });
				}
				return null;
			},
		};
		await expect(connectToKalyChain(provider)).resolves.toBe('added');
		expect(calls.map((c) => c.method)).toEqual([
			'wallet_switchEthereumChain',
			'wallet_addEthereumChain',
		]);
		expect(calls[1].params).toEqual([addChainParams()]);
	});

	it('user rejection (4001) cancels instead of firing a second prompt', async () => {
		const calls: string[] = [];
		const provider: Eip1193Provider = {
			request: async ({ method }) => {
				calls.push(method);
				throw Object.assign(new Error('rejected'), { code: 4001 });
			},
		};
		await expect(connectToKalyChain(provider)).resolves.toBe('cancelled');
		expect(calls).toEqual(['wallet_switchEthereumChain']);
	});

	it('surfaces a genuine add failure (e.g. RPC already used by another network)', async () => {
		const provider: Eip1193Provider = {
			request: async ({ method }) => {
				if (method === 'wallet_switchEthereumChain') {
					throw Object.assign(new Error('unknown'), { code: 4902 });
				}
				throw Object.assign(new Error('RPC URL already in use'), { code: -32602 });
			},
		};
		await expect(connectToKalyChain(provider)).rejects.toThrow('RPC URL already in use');
	});

	it('reads nested provider error codes', () => {
		expect(providerErrorCode({ code: 4001 })).toBe(4001);
		expect(providerErrorCode({ data: { originalError: { code: 4902 } } })).toBe(4902);
		expect(providerErrorCode({ cause: { code: 4001 } })).toBe(4001);
		expect(providerErrorCode(new Error('plain'))).toBeUndefined();
	});

	it('verifies the wallet actually landed on KalyChain', () => {
		expect(isOnKalyChain('0xf32')).toBe(true);
		expect(isOnKalyChain('0x1')).toBe(false);
		expect(isOnKalyChain(null)).toBe(false);
		expect(isOnKalyChain('not-hex')).toBe(false);
	});

	it('reads the current chain, returning null when the wallet refuses', async () => {
		await expect(currentChainId({ request: async () => '0xf32' })).resolves.toBe('0xf32');
		await expect(
			currentChainId({
				request: async () => {
					throw new Error('locked');
				},
			}),
		).resolves.toBeNull();
	});

	it('discovers multiple wallets via EIP-6963 so the request is not sent to the wrong one', async () => {
		const listeners: Array<(e: Event) => void> = [];
		const make = (uuid: string, name: string) => ({
			info: { uuid, name },
			provider: { request: async () => null } as Eip1193Provider,
		});
		vi.stubGlobal('window', {
			addEventListener: (_t: string, fn: (e: Event) => void) => listeners.push(fn),
			removeEventListener: () => {},
			dispatchEvent: () => {
				for (const fn of listeners) {
					fn({ detail: make('a', 'MetaMask') } as unknown as Event);
					fn({ detail: make('b', 'Rabby') } as unknown as Event);
				}
				return true;
			},
			setTimeout: (fn: () => void) => {
				fn();
				return 0;
			},
		});
		const found = await discoverWallets(0);
		expect(found.map((w) => w.name).sort()).toEqual(['MetaMask', 'Rabby']);
	});

	it('falls back to the legacy providers array when no wallet announces', async () => {
		const listeners: Array<(e: Event) => void> = [];
		vi.stubGlobal('window', {
			ethereum: {
				providers: [
					{ request: async () => null, isMetaMask: true },
					{ request: async () => null, isCoinbaseWallet: true },
				],
			},
			addEventListener: (_t: string, fn: (e: Event) => void) => listeners.push(fn),
			removeEventListener: () => {},
			dispatchEvent: () => true,
			setTimeout: (fn: () => void) => {
				fn();
				return 0;
			},
		});
		const found = await discoverWallets(0);
		expect(found.map((w) => w.name)).toEqual(['MetaMask', 'Coinbase Wallet']);
	});

	it('names a lone legacy provider rather than showing a blank button', () => {
		vi.stubGlobal('window', { ethereum: { request: async () => null, isBraveWallet: true } });
		expect(legacyWallets().map((w) => w.name)).toEqual(['Brave Wallet']);
	});

	it('returns no wallets when none are installed', async () => {
		vi.stubGlobal('window', {
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => true,
			setTimeout: (fn: () => void) => {
				fn();
				return 0;
			},
		});
		await expect(discoverWallets(0)).resolves.toEqual([]);
	});
});
