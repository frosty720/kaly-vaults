'use client';

interface LiveBadgeProps {
	updatedLabel?: string;
}

export function LiveBadge({ updatedLabel }: LiveBadgeProps) {
	return (
		<span className="inline-flex items-center gap-1.5">
			<span className="pulse-dot" aria-hidden="true" />
			<span className="text-xs text-muted-foreground">
				{updatedLabel ?? 'live'}
			</span>
		</span>
	);
}
