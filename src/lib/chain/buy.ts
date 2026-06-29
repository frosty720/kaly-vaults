/**
 * Converts a whole-USD tier price into the on-chain token amount
 * by scaling by the stable's decimal precision.
 *
 * Money-critical — any change here MUST be reflected in buy.test.ts.
 */
export function purchaseAmount(priceUsd: number, decimals: number): bigint {
	return BigInt(priceUsd) * 10n ** BigInt(decimals);
}
