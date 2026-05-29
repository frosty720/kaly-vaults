import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendReservedEmail, addToWaitlistAudience, getResendClient } from './resend';

describe('Resend no-op contract (no API key)', () => {
	let savedKey: string | undefined;

	beforeEach(() => {
		savedKey = process.env.RESEND_API_KEY;
		delete process.env.RESEND_API_KEY;
	});

	afterEach(() => {
		if (savedKey !== undefined) {
			process.env.RESEND_API_KEY = savedKey;
		} else {
			delete process.env.RESEND_API_KEY;
		}
	});

	it('getResendClient returns null when RESEND_API_KEY is unset', () => {
		expect(getResendClient()).toBeNull();
	});

	it('sendReservedEmail resolves to false without throwing', async () => {
		const result = await sendReservedEmail({ to: 'test@example.com', locale: 'en', tier: 'validator' });
		expect(result).toBe(false);
	});

	it('sendReservedEmail with FR locale resolves to false without throwing', async () => {
		const result = await sendReservedEmail({ to: 'test@example.com', locale: 'fr', tier: null });
		expect(result).toBe(false);
	});

	it('addToWaitlistAudience resolves to false without throwing', async () => {
		const result = await addToWaitlistAudience({ email: 'test@example.com' });
		expect(result).toBe(false);
	});

	it('addToWaitlistAudience resolves to false even when RESEND_AUDIENCE_ID is set but no key', async () => {
		const savedAudienceId = process.env.RESEND_AUDIENCE_ID;
		process.env.RESEND_AUDIENCE_ID = 'some-audience-id';
		try {
			const result = await addToWaitlistAudience({ email: 'test@example.com' });
			expect(result).toBe(false);
		} finally {
			if (savedAudienceId !== undefined) {
				process.env.RESEND_AUDIENCE_ID = savedAudienceId;
			} else {
				delete process.env.RESEND_AUDIENCE_ID;
			}
		}
	});
});
