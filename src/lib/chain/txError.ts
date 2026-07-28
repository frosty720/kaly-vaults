import { TxRevertedError } from './receipt';

/** Localized strings the mapper can return, supplied by the caller's dictionary. */
export interface TxErrorLabels {
	reverted: string;
	walletNotReady: string;
}

/**
 * Map a write failure to a message a buyer can act on.
 *
 * The one case worth translating is `eth_sendTransaction is not supported`.
 * That is our Besu node answering — which only happens when the write reached
 * the RPC transport instead of the wallet, i.e. wagmi had no signer connected.
 * Surfaced raw (as it was on 2026-07-28) it reads like the chain is broken,
 * when in fact nothing was sent and the buyer was not charged.
 */
export function txErrorMessage(e: unknown, labels: TxErrorLabels): string {
	if (e instanceof TxRevertedError) return labels.reverted;
	const x = e as { shortMessage?: string; message?: string } | null | undefined;
	const raw = x?.shortMessage || x?.message || '';
	if (raw.includes('eth_sendTransaction')) return labels.walletNotReady;
	return raw || 'Transaction failed';
}
