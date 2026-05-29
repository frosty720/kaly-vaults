import { BASE_KLC_PRICE } from '@/lib/tiers';

const KLC_PRICE_SOURCES = {
	dexApi: 'https://app.kalyswap.io/api/graphql',
	coingecko: 'https://api.coingecko.com/api/v3/simple/price?ids=kalycoin&vs_currencies=usd',
} as const;

const FETCH_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** A KLC/USD price is only accepted if it is a finite, positive, sane number. */
export function isValidKlcPrice(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1000;
}

/** Fetch with an AbortController timeout; returns null on any error/timeout. */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const response = await fetch(url, { ...init, signal: controller.signal });
		if (!response.ok) return null;
		return response;
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/** Try the DEX API, then CoinGecko. Returns BASE_KLC_PRICE if both fail or return junk. NO caching. */
export async function fetchKlcPrice(): Promise<number> {
	// 1. Primary: KalySwap DEX API
	try {
		const res = await fetchWithTimeout(KLC_PRICE_SOURCES.dexApi, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ dexOverview { klcPrice } }' }),
		});
		if (res !== null) {
			const json = await res.json() as unknown;
			const price = (json as { data?: { dexOverview?: { klcPrice?: unknown } } })
				?.data?.dexOverview?.klcPrice;
			if (isValidKlcPrice(price)) return price;
		}
	} catch {
		// fall through
	}

	// 2. Secondary: CoinGecko
	try {
		const res = await fetchWithTimeout(KLC_PRICE_SOURCES.coingecko);
		if (res !== null) {
			const json = await res.json() as unknown;
			const price = (json as { kalycoin?: { usd?: unknown } })?.kalycoin?.usd;
			if (isValidKlcPrice(price)) return price;
		}
	} catch {
		// fall through
	}

	// 3. Final fallback
	return BASE_KLC_PRICE;
}

// Module-level cache
let cache: { price: number; at: number } | null = null;

/** Memoized wrapper: caches fetchKlcPrice result for CACHE_TTL_MS (throttles network to once per 5 min). */
export async function getKlcPrice(): Promise<number> {
	if (cache !== null && Date.now() - cache.at < CACHE_TTL_MS) {
		return cache.price;
	}
	const price = await fetchKlcPrice();
	cache = { price, at: Date.now() };
	return price;
}

/** Test-only: reset the in-memory cache. */
export function __resetKlcPriceCache(): void {
	cache = null;
}
