import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	isValidKlcPrice,
	fetchKlcPrice,
	getKlcPrice,
	__resetKlcPriceCache,
} from '@/lib/price';
import { BASE_KLC_PRICE } from '@/lib/tiers';

// Build a minimal mock Response
function mockResponse(body: unknown, ok = true): Response {
	return {
		ok,
		json: async () => body,
	} as unknown as Response;
}

beforeEach(() => {
	vi.resetAllMocks();
	__resetKlcPriceCache();
});

// ---------------------------------------------------------------------------
// isValidKlcPrice
// ---------------------------------------------------------------------------
describe('isValidKlcPrice', () => {
	it('accepts a sane positive finite number', () => {
		expect(isValidKlcPrice(0.0022)).toBe(true);
	});

	it('rejects 0', () => {
		expect(isValidKlcPrice(0)).toBe(false);
	});

	it('rejects negative', () => {
		expect(isValidKlcPrice(-1)).toBe(false);
	});

	it('rejects NaN', () => {
		expect(isValidKlcPrice(NaN)).toBe(false);
	});

	it('rejects Infinity', () => {
		expect(isValidKlcPrice(Infinity)).toBe(false);
	});

	it('rejects a string that looks like a price', () => {
		expect(isValidKlcPrice('0.002')).toBe(false);
	});

	it('rejects null', () => {
		expect(isValidKlcPrice(null)).toBe(false);
	});

	it('rejects a value >= 1000', () => {
		expect(isValidKlcPrice(2000)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// fetchKlcPrice — case 1: DEX success
// ---------------------------------------------------------------------------
describe('fetchKlcPrice — DEX success', () => {
	it('returns the klcPrice from the DEX API', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
			mockResponse({ data: { dexOverview: { klcPrice: 0.0022198 } } }),
		));

		const price = await fetchKlcPrice();
		expect(price).toBeCloseTo(0.0022198, 7);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// fetchKlcPrice — case 2: DEX network throw, CoinGecko success
// ---------------------------------------------------------------------------
describe('fetchKlcPrice — DEX throws, CoinGecko success', () => {
	it('falls through to CoinGecko when DEX fetch rejects', async () => {
		const fetchMock = vi.fn()
			.mockRejectedValueOnce(new Error('network error'))
			.mockResolvedValueOnce(mockResponse({ kalycoin: { usd: 0.00211532 } }));

		vi.stubGlobal('fetch', fetchMock);

		const price = await fetchKlcPrice();
		expect(price).toBeCloseTo(0.00211532, 8);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

// ---------------------------------------------------------------------------
// fetchKlcPrice — case 3: DEX returns invalid value, CoinGecko success
// ---------------------------------------------------------------------------
describe('fetchKlcPrice — DEX invalid value, CoinGecko success', () => {
	it('falls through when klcPrice is 0', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(mockResponse({ data: { dexOverview: { klcPrice: 0 } } }))
			.mockResolvedValueOnce(mockResponse({ kalycoin: { usd: 0.00211532 } }));

		vi.stubGlobal('fetch', fetchMock);

		const price = await fetchKlcPrice();
		expect(price).toBeCloseTo(0.00211532, 8);
	});

	it('falls through when klcPrice is null', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(mockResponse({ data: { dexOverview: { klcPrice: null } } }))
			.mockResolvedValueOnce(mockResponse({ kalycoin: { usd: 0.00211532 } }));

		vi.stubGlobal('fetch', fetchMock);

		const price = await fetchKlcPrice();
		expect(price).toBeCloseTo(0.00211532, 8);
	});
});

// ---------------------------------------------------------------------------
// fetchKlcPrice — case 4: both sources fail
// ---------------------------------------------------------------------------
describe('fetchKlcPrice — both sources fail', () => {
	it('returns BASE_KLC_PRICE when both DEX and CoinGecko reject', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

		const price = await fetchKlcPrice();
		expect(price).toBe(BASE_KLC_PRICE);
	});
});

// ---------------------------------------------------------------------------
// fetchKlcPrice — case 5: DEX returns non-ok response
// ---------------------------------------------------------------------------
describe('fetchKlcPrice — DEX non-ok response', () => {
	it('falls through to CoinGecko on HTTP error from DEX', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(mockResponse({}, false))
			.mockResolvedValueOnce(mockResponse({ kalycoin: { usd: 0.00211532 } }));

		vi.stubGlobal('fetch', fetchMock);

		const price = await fetchKlcPrice();
		expect(price).toBeCloseTo(0.00211532, 8);
	});
});

// ---------------------------------------------------------------------------
// getKlcPrice — case 7: memoization
// ---------------------------------------------------------------------------
describe('getKlcPrice — memoization', () => {
	it('calls fetch only once for two rapid calls, then again after cache reset', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			mockResponse({ data: { dexOverview: { klcPrice: 0.0022198 } } }),
		);
		vi.stubGlobal('fetch', fetchMock);

		const p1 = await getKlcPrice();
		const p2 = await getKlcPrice();

		expect(p1).toBeCloseTo(0.0022198, 7);
		expect(p2).toBeCloseTo(0.0022198, 7);
		// Second call must be served from cache — only one network call
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// Reset cache → next call should hit the network again
		__resetKlcPriceCache();
		await getKlcPrice();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
