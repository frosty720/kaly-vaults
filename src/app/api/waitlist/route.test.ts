import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// --- module mocks (hoisted) ---
vi.mock('@/lib/supabase', () => ({
	getSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/resend', () => ({
	sendReservedEmail: vi.fn().mockResolvedValue(true),
	addToWaitlistAudience: vi.fn().mockResolvedValue(true),
}));

import { getSupabaseClient } from '@/lib/supabase';
import { sendReservedEmail, addToWaitlistAudience } from '@/lib/resend';
import { POST } from './route';

// Helper: build a Supabase client stub whose insert resolves to the given result.
// Cast through unknown because the stub intentionally only implements the subset used by the route.
const makeSupabase = (result: { error: unknown }): SupabaseClient =>
	({ from: () => ({ insert: () => Promise.resolve(result) }) } as unknown as SupabaseClient);

// Helper: valid EVM address
const VALID_WALLET = '0x' + '1'.repeat(40);
const VALID_EMAIL = 'user@example.com';

// Helper: build a POST NextRequest with distinct IP per test to avoid rate-limiter bleed.
function makeRequest(
	body: Record<string, unknown>,
	ip: string,
): NextRequest {
	return new NextRequest('http://localhost/api/waitlist', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'content-type': 'application/json',
			'x-forwarded-for': ip,
		},
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	// Reset default resolved values after clearAllMocks wipes them.
	vi.mocked(sendReservedEmail).mockResolvedValue(true);
	vi.mocked(addToWaitlistAudience).mockResolvedValue(true);
});

// ---------------------------------------------------------------------------
// 1. Valid + insert ok
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — valid signup, insert ok', () => {
	it('returns 200 { ok: true } and calls side-effect functions', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: null }));

		const req = makeRequest(
			{ email: 'User@Example.com', wallet: VALID_WALLET, tier: 'validator', locale: 'fr' },
			'10.0.0.1',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data).toEqual({ ok: true });
		expect(sendReservedEmail).toHaveBeenCalledTimes(1);
		expect(sendReservedEmail).toHaveBeenCalledWith({
			to: 'user@example.com',
			locale: 'fr',
			tier: 'validator',
		});
		expect(addToWaitlistAudience).toHaveBeenCalledTimes(1);
		expect(addToWaitlistAudience).toHaveBeenCalledWith({ email: 'user@example.com' });
	});
});

// ---------------------------------------------------------------------------
// 2. Duplicate email (Postgres 23505)
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — duplicate email', () => {
	it('returns 409 with error and does NOT call sendReservedEmail', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: { code: '23505' } }));

		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: VALID_WALLET, tier: null, locale: 'en' },
			'10.0.0.2',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(409);
		expect(data).toHaveProperty('error');
		expect(sendReservedEmail).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 3. DB error (non-unique)
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — DB error', () => {
	it('returns 500 and does NOT call sendReservedEmail', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: { code: '500x' } }));

		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: VALID_WALLET, tier: null, locale: 'en' },
			'10.0.0.3',
		);
		const res = await POST(req);

		expect(res.status).toBe(500);
		expect(sendReservedEmail).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 4. Invalid email
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — invalid email', () => {
	it('returns 400 and does not reach persistence or side effects', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: null }));

		const req = makeRequest(
			{ email: 'nope', wallet: VALID_WALLET, tier: null, locale: 'en' },
			'10.0.0.4',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data).toHaveProperty('error');
		expect(sendReservedEmail).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 5. Invalid wallet
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — invalid wallet', () => {
	it('returns 400 for a short wallet address', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: null }));

		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: '0x123', tier: null, locale: 'en' },
			'10.0.0.5',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(400);
		expect(data).toHaveProperty('error');
		expect(sendReservedEmail).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 6. Honeypot filled
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — honeypot', () => {
	it('silently returns 200 without touching Supabase or Resend', async () => {
		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: VALID_WALLET, tier: null, locale: 'en', hp: 'bot' },
			'10.0.0.6',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data).toEqual({ ok: true });
		expect(getSupabaseClient).not.toHaveBeenCalled();
		expect(sendReservedEmail).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// 7. No Supabase env (getSupabaseClient returns null)
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — no Supabase configured', () => {
	it('returns 200 and still calls sendReservedEmail', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(null);

		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: VALID_WALLET, tier: null, locale: 'en' },
			'10.0.0.7',
		);
		const res = await POST(req);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data).toEqual({ ok: true });
		expect(sendReservedEmail).toHaveBeenCalledTimes(1);
		expect(addToWaitlistAudience).toHaveBeenCalledTimes(1);
	});
});

// ---------------------------------------------------------------------------
// 8. Locale default (invalid locale falls back to 'en')
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — locale fallback', () => {
	it('passes locale: en to sendReservedEmail when body locale is invalid', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: null }));

		const req = makeRequest(
			{ email: VALID_EMAIL, wallet: VALID_WALLET, tier: null, locale: 'xx' },
			'10.0.0.8',
		);
		const res = await POST(req);

		expect(res.status).toBe(200);
		expect(sendReservedEmail).toHaveBeenCalledWith(
			expect.objectContaining({ locale: 'en' }),
		);
	});
});

// ---------------------------------------------------------------------------
// 9. Email lowercased
// ---------------------------------------------------------------------------
describe('POST /api/waitlist — email lowercasing', () => {
	it('normalises email to lowercase before passing to sendReservedEmail', async () => {
		vi.mocked(getSupabaseClient).mockReturnValue(makeSupabase({ error: null }));

		const req = makeRequest(
			{ email: 'USER@EXAMPLE.COM', wallet: VALID_WALLET, tier: null, locale: 'en' },
			'10.0.0.9',
		);
		const res = await POST(req);

		expect(res.status).toBe(200);
		expect(sendReservedEmail).toHaveBeenCalledWith(
			expect.objectContaining({ to: 'user@example.com' }),
		);
	});
});
