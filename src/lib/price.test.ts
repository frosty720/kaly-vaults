import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidTokenPrice, fetchKmtPrice, getKmtPrice, getKmtPriceDetailed, __resetKmtPriceCache } from '@/lib/price';
import { BASE_KMT_PRICE } from '@/lib/tiers';

function mockResponse(body: unknown, ok = true): Response {
	return { ok, json: async () => body } as unknown as Response;
}

beforeEach(() => {
	vi.resetAllMocks();
	__resetKmtPriceCache();
});

describe('isValidTokenPrice', () => {
	it('accepts a sane positive finite number', () => expect(isValidTokenPrice(0.2)).toBe(true));
	it('rejects 0', () => expect(isValidTokenPrice(0)).toBe(false));
	it('rejects negative', () => expect(isValidTokenPrice(-1)).toBe(false));
	it('rejects NaN / Infinity', () => {
		expect(isValidTokenPrice(NaN)).toBe(false);
		expect(isValidTokenPrice(Infinity)).toBe(false);
	});
	it('rejects strings and null', () => {
		expect(isValidTokenPrice('0.2')).toBe(false);
		expect(isValidTokenPrice(null)).toBe(false);
	});
	it('rejects a value >= 1000', () => expect(isValidTokenPrice(2000)).toBe(false));
});

describe('fetchKmtPrice — V3 subgraph bundle', () => {
	it('returns bundle.ethPriceUSD (the subgraph serialises BigDecimal as a string)', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({ data: { bundles: [{ ethPriceUSD: '0.2' }] } })));
		expect(await fetchKmtPrice()).toEqual({ usd: 0.2, source: 'subgraph' });
		expect(global.fetch).toHaveBeenCalledTimes(1);
		const [url, init] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
		expect(url).toMatch(/v3-subgraph-kmt$/);
		expect(JSON.parse(init.body as string).query).toContain('bundles');
	});

	it('falls back (labelled) when the bundle is empty, zero, junk, non-ok or the fetch throws', async () => {
		for (const body of [{ data: { bundles: [] } }, { data: { bundles: [{ ethPriceUSD: '0' }] } }, { data: { bundles: [{ ethPriceUSD: 'abc' }] } }, {}]) {
			vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(body)));
			expect(await fetchKmtPrice()).toEqual({ usd: BASE_KMT_PRICE, source: 'fallback' });
		}
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse({}, false)));
		expect(await fetchKmtPrice()).toEqual({ usd: BASE_KMT_PRICE, source: 'fallback' });
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		expect(await fetchKmtPrice()).toEqual({ usd: BASE_KMT_PRICE, source: 'fallback' });
	});
});

describe('getKmtPrice — memoization', () => {
	it('calls fetch once for two rapid calls, then again after a cache reset', async () => {
		const fetchMock = vi.fn().mockResolvedValue(mockResponse({ data: { bundles: [{ ethPriceUSD: '0.2041' }] } }));
		vi.stubGlobal('fetch', fetchMock);
		expect(await getKmtPrice()).toBeCloseTo(0.2041, 6);
		expect((await getKmtPriceDetailed()).source).toBe('subgraph');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		__resetKmtPriceCache();
		await getKmtPrice();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
