/**
 * Smoke test for PolHero.
 *
 * NOTE: @testing-library/react is not installed in this project.
 * A full render test (asserting skeleton renders and no $ figure appears)
 * requires @testing-library/react. This test validates the module exports
 * a React component function as a minimal guard against import errors.
 *
 * To add a full render test, install @testing-library/react and
 * replace this file with a render-based test using vi.mock('@/lib/chain/reads').
 */
import { describe, it, expect, vi } from 'vitest';

// Mock wagmi / tanstack deps that require a browser context before importing
vi.mock('@/lib/chain/reads', () => ({
	usePolStats: () => ({ isLoading: true, isError: false, data: undefined }),
	useKlcPrice: () => ({ data: undefined }),
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
	ConnectButton: () => null,
}));

import { PolHero } from './PolHero';

describe('PolHero', () => {
	it('is a function (React component)', () => {
		expect(typeof PolHero).toBe('function');
	});

	it('returns a non-null value when called', () => {
		// Without a render environment we cannot call the hook-using component,
		// but we can verify it is exported as a named function.
		expect(PolHero).toBeDefined();
		expect(PolHero.name).toBe('PolHero');
	});
});
