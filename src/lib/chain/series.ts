export interface PolEvent { timestamp: number; swapped: bigint; decimals: number }
export interface PolPoint { t: number; usd: number }

// Cumulative POL *added* (USD at deposit), from PolDeployed events.
// swapped = half the POL leg → full added per buy ≈ 2 * swapped (stable units → USD at $1 peg).
export function buildPolAddedSeries(events: PolEvent[]): PolPoint[] {
	const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
	let cum = 0;
	return sorted.map((e) => {
		cum += (Number(e.swapped) / 10 ** e.decimals) * 2;
		return { t: e.timestamp, usd: Math.round(cum * 100) / 100 };
	});
}
