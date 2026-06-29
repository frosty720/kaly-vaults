import { describe, it, expect } from 'vitest';
import { reconcileOwnedTokenIds } from './events';

describe('reconcileOwnedTokenIds', () => {
	it('keeps tokens received and not later sent away', () => {
		expect(reconcileOwnedTokenIds([1n, 2n, 3n], [2n])).toEqual([1n, 3n]);
	});
	it('empty received → empty', () => {
		expect(reconcileOwnedTokenIds([], [5n])).toEqual([]);
	});
});
