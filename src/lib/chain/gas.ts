/**
 * Gas-limit resolution for writes.
 *
 * A pinned gas limit is not just a safety cap — combined with `maxFeePerGas` it
 * is a SPEND CEILING. Wallets refuse to sign unless
 * `balance >= gas * maxFeePerGas`, so an over-provisioned constant silently
 * locks out users who hold plenty of KLC for the transaction's real cost.
 *
 * That is exactly what happened on 2026-07-28: `GAS_PURCHASE` was pinned at
 * 3,000,000 while a real purchase estimates at ~844,000. At 30 gwei the wallet
 * demanded 0.09 KLC to sign a transaction that actually costs ~0.025 KLC. A
 * buyer holding 0.0498 KLC could afford `approve` (100k gas → 0.003 KLC) but
 * not `purchase`, so their approval landed on-chain and the purchase never did.
 *
 * So: prefer a live estimate plus headroom, and fall back to the pinned ceiling
 * only when estimation fails (Besu's `eth_estimateGas` is unreliable for some
 * transactions, which is why the constants exist in the first place).
 */

/** Headroom over a live estimate, as a fraction — 3/2 = +50%. */
export const HEADROOM_NUM = 3n;
export const HEADROOM_DEN = 2n;

/** Pad a gas estimate with headroom so a slightly heavier tx still fits. */
export function withHeadroom(estimate: bigint): bigint {
	return (estimate * HEADROOM_NUM) / HEADROOM_DEN;
}

/**
 * Resolve the gas limit for a write.
 *
 * @param estimate  Thunk performing the live estimate; may reject.
 * @param fallback  Pinned ceiling used when estimation is unavailable or fails.
 *
 * A successful estimate wins even if it is LARGER than the fallback — the
 * fallback is a stand-in for an unknown cost, not an upper bound on a known one.
 */
export async function resolveGas(
	estimate: () => Promise<bigint>,
	fallback: bigint,
): Promise<bigint> {
	try {
		const est = await estimate();
		// A zero/absurd estimate means the node answered but not usefully.
		if (est <= 0n) return fallback;
		return withHeadroom(est);
	} catch {
		return fallback;
	}
}
