import { describe, it, expect } from 'vitest';
import { buildPolAddedSeries } from './series';

describe('buildPolAddedSeries', () => {
	it('accumulates swapped*2 (full POL added) per event over time', () => {
		const pts = buildPolAddedSeries([
			{ timestamp: 100, swapped: 45_500000n, decimals: 6 },
			{ timestamp: 200, swapped: 22_750000n, decimals: 6 },
		]);
		expect(pts).toEqual([
			{ t: 100, usd: 91 },
			{ t: 200, usd: 136.5 },
		]);
	});
	it('sorts by time and handles empty (no fabricated baseline)', () => {
		expect(buildPolAddedSeries([])).toEqual([]);
	});
});
