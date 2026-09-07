import { BASE_KMT_PRICE } from '@/lib/tiers';
import { V3_SUBGRAPH_URL } from '@/lib/chain/subgraph';

/**
 * KMT/USD for the server-rendered landing page (and the dApp's last-resort fallback).
 * Source: the KalySwap V3 subgraph's bundle — WKMT is the base token, so `ethPriceUSD` IS
 * the KMT price, derived from the deepest stable pool. There is no CEX listing for KMT and
 * no DEX-API endpoint any more, so this is the only market price there is.
 * Anything else falls back to BASE_KMT_PRICE, which the UI labels as a fallback.
 */
const FETCH_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface KmtPrice {
	usd: number;
	/** 'subgraph' = live market read; 'fallback' = BASE_KMT_PRICE because the read failed. */
	source: 'subgraph' | 'fallback';
}

/** A KMT/USD price is only accepted if it is a finite, positive, sane number. */
export function isValidTokenPrice(value: unknown): value is number {
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

/** One uncached read of the V3 subgraph bundle; BASE_KMT_PRICE (labelled) if it fails or returns junk. */
export async function fetchKmtPrice(): Promise<KmtPrice> {
	try {
		const res = await fetchWithTimeout(V3_SUBGRAPH_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: '{ bundles(first: 1) { ethPriceUSD } }' }),
		});
		if (res !== null) {
			const json = (await res.json()) as { data?: { bundles?: { ethPriceUSD?: unknown }[] } };
			const raw = json?.data?.bundles?.[0]?.ethPriceUSD;
			const price = typeof raw === 'string' ? Number(raw) : raw;
			if (isValidTokenPrice(price)) return { usd: price, source: 'subgraph' };
		}
	} catch {
		// fall through
	}
	return { usd: BASE_KMT_PRICE, source: 'fallback' };
}

// Module-level cache
let cache: { price: KmtPrice; at: number } | null = null;

/** Memoized wrapper: caches fetchKmtPrice for CACHE_TTL_MS (throttles network to once per 5 min). */
export async function getKmtPriceDetailed(): Promise<KmtPrice> {
	if (cache !== null && Date.now() - cache.at < CACHE_TTL_MS) {
		return cache.price;
	}
	const price = await fetchKmtPrice();
	cache = { price, at: Date.now() };
	return price;
}

/** Memoized KMT/USD number (see getKmtPriceDetailed for the source label). */
export async function getKmtPrice(): Promise<number> {
	return (await getKmtPriceDetailed()).usd;
}

/** Test-only: reset the in-memory cache. */
export function __resetKmtPriceCache(): void {
	cache = null;
}
