import type { PublicClient } from 'viem';

/** Minimal structural slice of PublicClient so tests can pass a plain mock. */
type ReceiptClient = Pick<PublicClient, 'waitForTransactionReceipt'>;

/** Thrown when a mined transaction has status 'reverted'. Callers match on this
 * (instanceof) to show a localized "reverted, you were not charged" message. */
export class TxRevertedError extends Error {
	readonly hash: `0x${string}`;
	constructor(hash: `0x${string}`) {
		super(`Transaction reverted on-chain (${hash})`);
		this.name = 'TxRevertedError';
		this.hash = hash;
	}
}

/**
 * Wait for a tx receipt and require it to have succeeded.
 *
 * viem's waitForTransactionReceipt resolves for REVERTED txs too (it only throws
 * on timeout/replacement), so awaiting it alone is NOT proof of success — that
 * gap made the dApp show "Purchase successful!" for reverted buys (2026-07-08
 * mainnet incident). Throws TxRevertedError on any non-success status.
 */
export async function waitForSuccess(
	client: ReceiptClient,
	hash: `0x${string}`,
	timeout = 90_000,
): Promise<void> {
	const receipt = await client.waitForTransactionReceipt({ hash, timeout });
	if (receipt.status !== 'success') throw new TxRevertedError(hash);
}
