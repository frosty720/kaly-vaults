'use client';

interface ChartPoint {
	t: number;
	usd: number;
}

interface AreaChartProps {
	points: ChartPoint[];
	height?: number;
	emptyLabel?: string;
}

/**
 * Cumulative-POL-added area chart. Smooth line, gradient fill, faint grid, and a
 * glowing endpoint with a one-shot draw-on animation. Empty/insufficient data
 * renders an honest message — never an invented curve.
 */
export function AreaChart({ points, height = 120, emptyLabel = 'No POL deposits yet' }: AreaChartProps) {
	if (points.length < 2) {
		return (
			<div
				className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-xs text-muted-foreground"
				style={{ height }}
			>
				{emptyLabel}
			</div>
		);
	}

	const W = 600;
	const H = height;
	const PADX = 6;
	const PADY = 12;

	const min = Math.min(...points.map((p) => p.usd));
	const max = Math.max(...points.map((p) => p.usd));
	const range = max - min || 1;

	const toX = (i: number) => PADX + (i / (points.length - 1)) * (W - PADX * 2);
	const toY = (usd: number) => PADY + (1 - (usd - min) / range) * (H - PADY * 2);

	const coords = points.map((p, i) => ({ x: toX(i), y: toY(p.usd) }));

	// Smooth the line with a simple Catmull-Rom → cubic-bezier conversion.
	let line = `M${coords[0].x},${coords[0].y}`;
	for (let i = 0; i < coords.length - 1; i++) {
		const p0 = coords[i - 1] ?? coords[i];
		const p1 = coords[i];
		const p2 = coords[i + 1];
		const p3 = coords[i + 2] ?? p2;
		const c1x = p1.x + (p2.x - p0.x) / 6;
		const c1y = p1.y + (p2.y - p0.y) / 6;
		const c2x = p2.x - (p3.x - p1.x) / 6;
		const c2y = p2.y - (p3.y - p1.y) / 6;
		line += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
	}
	const area = `${line} L${coords[coords.length - 1].x},${H} L${coords[0].x},${H} Z`;
	const last = coords[coords.length - 1];

	return (
		<svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden="true">
			<defs>
				<linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#f59e0b" stopOpacity="0.42" />
					<stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
				</linearGradient>
				<filter id="area-glow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" result="b" />
					<feMerge>
						<feMergeNode in="b" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* horizontal grid lines */}
			{[0.25, 0.5, 0.75].map((f) => (
				<line
					key={f}
					x1={0}
					x2={W}
					y1={PADY + f * (H - PADY * 2)}
					y2={PADY + f * (H - PADY * 2)}
					stroke="rgba(255,255,255,0.05)"
					strokeWidth="1"
				/>
			))}

			<path d={area} fill="url(#area-grad)" />
			<path
				className="chart-line"
				d={line}
				fill="none"
				stroke="#f59e0b"
				strokeWidth="2"
				strokeLinejoin="round"
				strokeLinecap="round"
				pathLength={1}
				style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'draw-line 1.1s ease-out forwards' }}
			/>
			<circle cx={last.x} cy={last.y} r="4" fill="#fbbf24" filter="url(#area-glow)" />
		</svg>
	);
}
