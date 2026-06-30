'use client';

import { useId } from 'react';
import type { PolPoint } from '@/lib/chain/subgraph';

interface AreaChartProps {
	points: PolPoint[];
	height?: number;
	emptyLabel?: string;
}

/**
 * Minimal dependency-free SVG area chart for the cumulative-POL trend. Pure presentational:
 * scales the points into the viewbox and draws a filled area + line. No tooltips/axes to keep
 * it light (it's a sparkline-style trend, not an analytics chart).
 */
export function AreaChart({ points, height = 120, emptyLabel = 'No data yet' }: AreaChartProps) {
	const gradId = useId();
	if (points.length < 2) {
		return (
			<div
				className="flex items-center justify-center text-xs text-white/30"
				style={{ height }}
			>
				{emptyLabel}
			</div>
		);
	}

	const W = 600;
	const H = height;
	const pad = 4;
	const xs = points.map((p) => p.t);
	const ys = points.map((p) => p.usd);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const maxY = Math.max(...ys, 1);
	const spanX = maxX - minX || 1;

	const sx = (t: number) => pad + ((t - minX) / spanX) * (W - pad * 2);
	const sy = (v: number) => H - pad - (v / maxY) * (H - pad * 2);

	const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.t).toFixed(1)} ${sy(p.usd).toFixed(1)}`).join(' ');
	const area = `${line} L ${sx(maxX).toFixed(1)} ${H - pad} L ${sx(minX).toFixed(1)} ${H - pad} Z`;

	return (
		<svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Protocol liquidity over time">
			<defs>
				<linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="rgba(245,158,11,0.35)" />
					<stop offset="100%" stopColor="rgba(245,158,11,0)" />
				</linearGradient>
			</defs>
			<path d={area} fill={`url(#${gradId})`} />
			<path d={line} fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
		</svg>
	);
}
