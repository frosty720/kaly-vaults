/**
 * Cut-over notice guards. No @testing-library/react in this repo (see PolHero.test.tsx),
 * so this covers what matters without a render: the module exports, the localStorage
 * dismissal persistence, and the EN/FR dictionary contract the component renders from.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
	CutoverNotice,
	CUTOVER_STORAGE_KEY,
	isCutoverDismissed,
	dismissCutover,
	fillTemplate,
} from './CutoverNotice';
import en from '@/i18n/dictionaries/en';
import fr from '@/i18n/dictionaries/fr';

function stubStorage(store: Record<string, string>) {
	(globalThis as { localStorage?: unknown }).localStorage = {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: (k: string, v: string) => {
			store[k] = v;
		},
	};
}

describe('CutoverNotice', () => {
	it('is a named React component', () => {
		expect(typeof CutoverNotice).toBe('function');
		expect(CutoverNotice.name).toBe('CutoverNotice');
	});

	describe('dismissal persistence', () => {
		let store: Record<string, string>;
		beforeEach(() => {
			store = {};
			stubStorage(store);
		});

		it('is not dismissed on a fresh browser', () => {
			expect(isCutoverDismissed()).toBe(false);
		});

		it('dismiss persists under the versioned key', () => {
			dismissCutover();
			expect(store[CUTOVER_STORAGE_KEY]).toBe('1');
			expect(isCutoverDismissed()).toBe(true);
		});

		it('survives a broken localStorage (private mode)', () => {
			(globalThis as { localStorage?: unknown }).localStorage = {
				getItem: () => {
					throw new Error('denied');
				},
				setItem: () => {
					throw new Error('denied');
				},
			};
			expect(isCutoverDismissed()).toBe(false);
			expect(() => dismissCutover()).not.toThrow();
		});
	});

	describe('dictionary contract', () => {
		it('EN and FR expose the same cutover keys', () => {
			expect(Object.keys(fr.cutover).sort()).toEqual(Object.keys(en.cutover).sort());
		});

		it('every cutover string is non-empty in both locales', () => {
			for (const dict of [en, fr]) {
				for (const [key, value] of Object.entries(dict.cutover)) {
					expect(typeof value, `cutover.${key}`).toBe('string');
					expect((value as string).length, `cutover.${key}`).toBeGreaterThan(0);
				}
			}
		});

		it('the body states the 110:1 old-ticker → KMT conversion in both locales', () => {
			for (const dict of [en, fr]) {
				expect(dict.cutover.body).toMatch(/110\s*:\s*1|110:1/);
				expect(dict.cutover.body).toContain('KMT');
				expect(dict.cutover.body).toContain('KLC');
			}
		});

		it('names the wallet in every string the user reads while acting on one', () => {
			// Users run several wallets; a prompt that says "your wallet" is unfindable.
			for (const dict of [en, fr]) {
				for (const key of ['addNetwork', 'adding', 'cancelled', 'wrongChain', 'error'] as const) {
					expect(dict.cutover[key], `cutover.${key}`).toContain('{wallet}');
				}
			}
		});

		it('leaves no unfilled placeholder once wallet and network are supplied', () => {
			for (const dict of [en, fr]) {
				for (const [key, value] of Object.entries(dict.cutover)) {
					const filled = fillTemplate(value as string, {
						wallet: 'MetaMask',
						network: 'KalyChain KMT',
					});
					expect(filled, `cutover.${key}`).not.toMatch(/\{\w+\}/);
				}
			}
		});
	});

	describe('fillTemplate', () => {
		it('substitutes every occurrence', () => {
			expect(fillTemplate('{wallet} then {wallet}', { wallet: 'Rabby' })).toBe('Rabby then Rabby');
		});

		it('leaves an unknown placeholder intact rather than printing "undefined"', () => {
			expect(fillTemplate('hi {nope}', { wallet: 'MetaMask' })).toBe('hi {nope}');
		});

		it('returns plain strings untouched', () => {
			expect(fillTemplate('no placeholders', {})).toBe('no placeholders');
		});
	});
});
