import { describe, it, expect } from 'vitest';
import { txErrorMessage } from './txError';
import { TxRevertedError } from './receipt';

const LABELS = { reverted: 'REVERTED_COPY', walletNotReady: 'NOT_READY_COPY' };

describe('txErrorMessage', () => {
	it('maps a mined-but-reverted tx to the reverted copy', () => {
		const msg = txErrorMessage(new TxRevertedError('0xabc'), LABELS);
		expect(msg).toBe('REVERTED_COPY');
	});

	// Verbatim from KalyChain's Besu node, as seen by the stranded buyer on 2026-07-28.
	it('maps the node\'s eth_sendTransaction refusal to wallet-not-ready', () => {
		const e = {
			shortMessage: 'Method "eth_sendTransaction" is not supported.',
			message:
				'The method eth_sendTransaction is not supported. Use eth_sendRawTransaction to send a signed transaction to Besu.',
		};
		expect(txErrorMessage(e, LABELS)).toBe('NOT_READY_COPY');
	});

	it('matches on the long message even when shortMessage is absent', () => {
		const e = { message: 'The method eth_sendTransaction is not supported.' };
		expect(txErrorMessage(e, LABELS)).toBe('NOT_READY_COPY');
	});

	it('does not hijack unrelated failures', () => {
		expect(txErrorMessage({ shortMessage: 'User rejected the request.' }, LABELS)).toBe(
			'User rejected the request.',
		);
		expect(txErrorMessage({ shortMessage: 'Insufficient funds for gas' }, LABELS)).toBe(
			'Insufficient funds for gas',
		);
	});

	it('prefers shortMessage over message', () => {
		const e = { shortMessage: 'short', message: 'long' };
		expect(txErrorMessage(e, LABELS)).toBe('short');
	});

	it('falls back for null, undefined and empty errors', () => {
		expect(txErrorMessage(null, LABELS)).toBe('Transaction failed');
		expect(txErrorMessage(undefined, LABELS)).toBe('Transaction failed');
		expect(txErrorMessage({}, LABELS)).toBe('Transaction failed');
	});
});
