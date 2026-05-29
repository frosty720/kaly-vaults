import { Resend } from 'resend';
import { reservedEmail } from '@/lib/emails/reserved';
import type { Locale } from '@/i18n/config';

/** Resend client when RESEND_API_KEY is set, else null. */
export function getResendClient(): Resend | null {
	const key = process.env.RESEND_API_KEY;
	return key ? new Resend(key) : null;
}

/** Sends the reserved-spot email. No-op (returns false) if RESEND_API_KEY is not set. */
export async function sendReservedEmail(args: {
	to: string;
	locale: Locale;
	tier: string | null;
}): Promise<boolean> {
	const resend = getResendClient();
	if (!resend) return false;
	const from = process.env.RESEND_FROM ?? 'KalyChain Vault <onboarding@resend.dev>';
	const { subject, html } = reservedEmail(args.locale, { tier: args.tier });
	await resend.emails.send({ from, to: args.to, subject, html });
	return true;
}

/** Adds the contact to the Resend audience. No-op (returns false) if RESEND_API_KEY or RESEND_AUDIENCE_ID is not set. */
export async function addToWaitlistAudience(args: { email: string }): Promise<boolean> {
	const resend = getResendClient();
	const audienceId = process.env.RESEND_AUDIENCE_ID;
	if (!resend || !audienceId) return false;
	await resend.contacts.create({ audienceId, email: args.email, unsubscribed: false });
	return true;
}
