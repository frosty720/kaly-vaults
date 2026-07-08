import { describe, it, expect, vi } from 'vitest';
import { waitForSuccess, TxRevertedError } from './receipt';

const HASH = '0xabc0000000000000000000000000000000000000000000000000000000000123' as const;

function mockClient(status: 'success' | 'reverted') {
	return {
		waitForTransactionReceipt: vi.fn().mockResolvedValue({ status }),
	};
}

describe('waitForSuccess', () => {
	it('resolves when the receipt status is success', async () => {
		const client = mockClient('success');
		await expect(waitForSuccess(client, HASH)).resolves.toBeUndefined();
		expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: HASH, timeout: 90_000 });
	});

	it('throws TxRevertedError when the receipt status is reverted', async () => {
		const client = mockClient('reverted');
		const err = await waitForSuccess(client, HASH).catch((e) => e);
		expect(err).toBeInstanceOf(TxRevertedError);
		expect((err as TxRevertedError).hash).toBe(HASH);
	});

	it('passes a custom timeout through to waitForTransactionReceipt', async () => {
		const client = mockClient('success');
		await waitForSuccess(client, HASH, 5_000);
		expect(client.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: HASH, timeout: 5_000 });
	});

	it('propagates errors from waitForTransactionReceipt (e.g. timeout)', async () => {
		const boom = new Error('Timed out while waiting for transaction');
		const client = {
			waitForTransactionReceipt: vi.fn().mockRejectedValue(boom),
		};
		await expect(waitForSuccess(client, HASH)).rejects.toBe(boom);
	});
});
