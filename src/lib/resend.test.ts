import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sendReservedEmail, addToWaitlistTopic, getResendClient } from './resend';

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

	it('addToWaitlistTopic resolves to false without throwing', async () => {
		const result = await addToWaitlistTopic({ email: 'test@example.com' });
		expect(result).toBe(false);
	});

	it('addToWaitlistTopic resolves to false even when RESEND_TOPIC_ID is set but no key', async () => {
		const savedTopicId = process.env.RESEND_TOPIC_ID;
		process.env.RESEND_TOPIC_ID = 'some-topic-id';
		try {
			const result = await addToWaitlistTopic({ email: 'test@example.com' });
			expect(result).toBe(false);
		} finally {
			if (savedTopicId !== undefined) {
				process.env.RESEND_TOPIC_ID = savedTopicId;
			} else {
				delete process.env.RESEND_TOPIC_ID;
			}
		}
	});
});
