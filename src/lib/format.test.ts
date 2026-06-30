import { describe, it, expect } from 'vitest';
import { fmtUsd, fmtKlc, shortAddr } from './format';

describe('format', () => {
	it('formats', () => {
		expect(fmtUsd(1234.5)).toBe('$1,234.50');
		expect(fmtKlc(842.5)).toBe('842.5 KLC');
		expect(shortAddr('0xaE51f2EfE70e57b994BE8F7f97C4dC824c51802a')).toBe('0xaE51…802a');
	});
});
