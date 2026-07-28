import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

// SUBGRAPH_URL/hasSubgraph are resolved from NEXT_PUBLIC_CHAIN at module load; only mainnet
// has a subgraph, so the env must be set before the module is imported.
let fetchAffiliateGraph: typeof import('./subgraph').fetchAffiliateGraph;
beforeAll(async () => {
	vi.stubEnv('NEXT_PUBLIC_CHAIN', 'mainnet');
	vi.resetModules();
	({ fetchAffiliateGraph } = await import('./subgraph'));
});

const USDT = '0x2CA775C77B922A51FcF3097F52bFFdbc0250D99A'.toLowerCase();
const KUSD = '0xCd02480926317748e95c5bBBbb7D1070b2327f1A'.toLowerCase();
const AFF1 = '0x1F425B0F95f939Df6f2a977ea38Cb93FDd91f012';
const AFF2 = '0xEd60426bF457B1625F3C04ecE1548bF5F7792fe2';
const BUYER = '0xFcC1D8b5F4B9DAbc954b914A065A8a9128fb3c04';

function stubGraphResponse(data: unknown) {
	vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ data }) })));
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('fetchAffiliateGraph', () => {
	it('parses commission legs from entity-shaped level fields with per-stable decimals', async () => {
		stubGraphResponse({
			_meta: { block: { number: 51784563, timestamp: 1783980000 } },
			accounts: [{ address: BUYER, sponsor: { address: AFF2 } }],
			commissions: [
				{
					// $100 pack: dev $2, DAO base $8 + the unpaid L3 $1.50 = $9.50.
					buyer: { address: BUYER }, stable: USDT,
					level1: { address: AFF2 }, level2: { address: AFF1 }, level3: null,
					amount1: '6000000', amount2: '2500000', amount3: '1500000',
					devAmount: '2000000', daoAmount: '9500000', timestamp: '1782852408',
				},
				{
					// $50 pack: dev $1, DAO base $4 + the unpaid L2 $1.25 + L3 $0.75 = $6.
					buyer: { address: BUYER }, stable: KUSD,
					level1: { address: AFF1 }, level2: null, level3: null,
					amount1: '3000000000000000000', amount2: '1250000000000000000', amount3: '750000000000000000',
					devAmount: '1000000000000000000', daoAmount: '6000000000000000000',
					timestamp: '1782852540',
				},
			],
		});

		const { edges, legs, head } = await fetchAffiliateGraph();

		expect(head).toBe(51784563n);
		expect(edges).toEqual([{ buyer: BUYER.toLowerCase(), sponsor: AFF2.toLowerCase() }]);
		// USDT (6-dec): L1 + L2 qualified, L3 unqualified (null → rolled to DAO, excluded).
		// KUSD (18-dec): only L1 qualified. Same $ values despite different raw magnitudes.
		expect(legs).toHaveLength(3);
		expect(legs[0]).toMatchObject({ affiliate: AFF2.toLowerCase(), level: 1, usd: 6, buyer: BUYER.toLowerCase() });
		expect(legs[1]).toMatchObject({ affiliate: AFF1.toLowerCase(), level: 2, usd: 2.5 });
		expect(legs[2]).toMatchObject({ affiliate: AFF1.toLowerCase(), level: 1, usd: 3 });
	});

	it('requests level fields with a selection set (scalar-queried entity refs are silently omitted)', async () => {
		stubGraphResponse({
			_meta: { block: { number: 1, timestamp: 0 } },
			accounts: [],
			commissions: [],
		});
		await fetchAffiliateGraph();
		const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
		for (const field of ['buyer { address }', 'level1 { address }', 'level2 { address }', 'level3 { address }']) {
			expect(body.query).toContain(field);
		}
	});

	it('excludes zero-address and zero-amount legs', async () => {
		stubGraphResponse({
			_meta: { block: { number: 1, timestamp: 0 } },
			accounts: [],
			commissions: [
				{
					buyer: { address: BUYER }, stable: USDT,
					level1: { address: '0x0000000000000000000000000000000000000000' }, level2: { address: AFF1 }, level3: null,
					amount1: '6000000', amount2: '0', amount3: '0',
					devAmount: '2000000', daoAmount: '8000000', timestamp: '1782852408',
				},
			],
		});
		const { legs } = await fetchAffiliateGraph();
		expect(legs).toEqual([]);
	});

	// Regression: mainnet tx 0xf3ca68e3…ba19e (block ~52.0M). FeesRouted named 0xff3c… as level2
	// with a $25 amount, but that address held no vault at the time, so the $25 was transferred to
	// the DAO treasury — verified against the ERC20 Transfers in that tx (N1 $60, dev $20, DAO $120;
	// nothing to 0xff3c…). The dashboard used to credit it as earned.
	it('excludes a named-but-unqualified level whose commission rolled to the DAO', async () => {
		const L1 = '0x44a0c354add28225c8722f4f0e5f59ab552b56d5';
		const UNQUALIFIED = '0xff3c9793ef3996bbb5f9b811d31c12ff3c99e287';
		stubGraphResponse({
			_meta: { block: { number: 52000000, timestamp: 1783442209 } },
			accounts: [],
			commissions: [
				{
					buyer: { address: BUYER }, stable: USDT,
					level1: { address: L1 }, level2: { address: UNQUALIFIED }, level3: null,
					amount1: '60000000', amount2: '25000000', amount3: '15000000',
					// DAO $120 = $80 base + the unpaid L2 $25 + the empty L3 $15.
					devAmount: '20000000', daoAmount: '120000000', timestamp: '1783442209',
				},
			],
		});
		const { legs } = await fetchAffiliateGraph();
		expect(legs).toHaveLength(1);
		expect(legs[0]).toMatchObject({ affiliate: L1, level: 1, usd: 60 });
		expect(legs.some((l) => l.affiliate === UNQUALIFIED)).toBe(false);
	});
});
