import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendReservedEmail, addToWaitlistTopic } from '@/lib/resend';
import { isLocale } from '@/i18n/config';

interface WaitlistPayload {
	email?: unknown;
	wallet?: unknown;
	tier?: unknown;
	locale?: unknown;
	hp?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

// Simple in-memory rate limit (resets on cold start). Swap for Redis/Upstash in prod.
const HITS = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;

function rateLimit(ip: string): boolean {
	const now = Date.now();
	const entry = HITS.get(ip);
	if (!entry || entry.resetAt < now) {
		HITS.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
		return true;
	}
	if (entry.count >= RATE_MAX) return false;
	entry.count += 1;
	return true;
}

export async function POST(request: NextRequest) {
	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
		request.headers.get('x-real-ip') ??
		'unknown';

	if (!rateLimit(ip)) {
		return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 });
	}

	let body: WaitlistPayload;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
	}

	// Honeypot — silently 200 if a bot filled it
	if (typeof body.hp === 'string' && body.hp.length > 0) {
		return NextResponse.json({ ok: true });
	}

	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
	const wallet = typeof body.wallet === 'string' ? body.wallet.trim() : '';
	const tier = typeof body.tier === 'string' && body.tier.length > 0 ? body.tier : null;
	const localeRaw = typeof body.locale === 'string' ? body.locale : '';
	const locale = isLocale(localeRaw) ? localeRaw : 'en';

	if (!EMAIL_RE.test(email)) {
		return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
	}
	if (!ADDR_RE.test(wallet)) {
		return NextResponse.json({ error: 'Invalid EVM wallet address.' }, { status: 400 });
	}

	const supabase = getSupabaseClient();
	if (supabase) {
		const { error } = await supabase.from('waitlist').insert({ email, wallet, tier, locale, ip });
		if (error) {
			// Unique-violation on email => already on the list (friendly, not an error)
			if (error.code === '23505') {
				return NextResponse.json({ error: 'Already on the waitlist.' }, { status: 409 });
			}
			console.error('[waitlist] supabase insert failed', error);
			return NextResponse.json(
				{ error: 'Could not save your signup. Please try again.' },
				{ status: 500 },
			);
		}
	} else {
		// No Supabase configured (local dev): log so the form stays functional.
		console.log('[waitlist] (no SUPABASE env) signup', { email, wallet, tier, locale, ip });
	}

	// Post-signup side effects — must NEVER fail the signup if they error.
	const results = await Promise.allSettled([
		sendReservedEmail({ to: email, locale, tier }),
		addToWaitlistTopic({ email }),
	]);
	for (const r of results) {
		if (r.status === 'rejected') {
			console.error('[waitlist] post-signup side effect failed', r.reason);
		}
	}

	return NextResponse.json({ ok: true });
}
