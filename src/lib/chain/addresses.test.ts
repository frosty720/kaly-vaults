import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ADDRESSES, getAddresses } from './addresses';

// kalychain-ops/files/kmt-3890/addresses.json is the ecosystem's address book.
const OPS_BOOK = join(__dirname, '..', '..', '..', '..', 'kalychain-ops', 'files', 'kmt-3890', 'addresses.json');

describe('addresses (KalyChain 3890)', () => {
	it('returns the v5 vault stack, WKMT, the DAO treasury and USDT only', () => {
		const a = getAddresses();
		expect(a).toBe(ADDRESSES);
		expect(a.vaultManager).toBe('0xDA2A7a2D504949896e709F546B6Bc06C2E7c5982');
		expect(a.rewardsPool).toBe('0x82eeCEcF8C3bbD94A3A11Abe04Ce3F49BbA35E52');
		expect(a.wrappedNative).toBe('0xf90F0Bd56558Ac12F7FC285571D38181d2feD69b');
		expect(a.positionManager).toBe('0xCa4a8fC696ADAE8edC042cB9E32Cd7F0A28EBdf0');
		expect(a.treasury).toBe('0xDF8CFefEa7DaA5E5B23c262A461aCcA6356BCA90');
		expect(Object.keys(a.stables)).toEqual(['USDT']);
		expect(a.stables.USDT).toEqual({ address: '0x6318EcDbae6B469D39C38949eDC671f4bA8A6172', decimals: 6, pool: '0xa9Ac6D3c75A883Cc5D6EfE7EbB973c68174bA61F' });
		expect(a.deployBlock).toBe(BigInt(4581));
	});

	it('matches the ops address book', () => {
		expect(existsSync(OPS_BOOK), `address book not found at ${OPS_BOOK}`).toBe(true);
		const book = JSON.parse(readFileSync(OPS_BOOK, 'utf8'));
		const flat = JSON.stringify(book).toLowerCase();
		expect(book.vaults.vaultManager.toLowerCase()).toBe(ADDRESSES.vaultManager.toLowerCase());
		expect(book.vaults.rewardsPool.toLowerCase()).toBe(ADDRESSES.rewardsPool.toLowerCase());
		expect(book.vaults.subgraphStartBlock).toBe(Number(ADDRESSES.deployBlock));
		expect(book.treasury.toLowerCase()).toBe(ADDRESSES.treasury.toLowerCase());
		expect(book.tokens.WKMT.toLowerCase()).toBe(ADDRESSES.wrappedNative.toLowerCase());
		expect(book.uniswapV3.positionManager.toLowerCase()).toBe(ADDRESSES.positionManager.toLowerCase());
		expect(book.tokens.USDT.toLowerCase()).toBe(ADDRESSES.stables.USDT.address.toLowerCase());
		expect(flat).toContain(ADDRESSES.stables.USDT.pool.toLowerCase());
	});

	it('WKMT is not the Hyperlane mailbox (the 3888 WKLC address collision)', () => {
		expect(ADDRESSES.wrappedNative.toLowerCase()).not.toBe('0x069255299bb729399f3cecabdc73d15d3d10a2a3');
	});
});
