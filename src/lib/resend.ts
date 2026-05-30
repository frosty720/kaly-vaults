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

/**
 * Subscribes the contact to the waitlist topic (opt-in).
 * No-op (returns false) if RESEND_API_KEY or RESEND_TOPIC_ID is not set.
 * Note: `audienceId` is deprecated in resend v6 — contacts are global and organised by topics/segments.
 */
export async function addToWaitlistTopic(args: { email: string }): Promise<boolean> {
	const resend = getResendClient();
	const topicId = process.env.RESEND_TOPIC_ID;
	if (!resend || !topicId) return false;
	await resend.contacts.create({
		email: args.email,
		topics: [{ id: topicId, subscription: 'opt_in' }],
	});
	return true;
}
