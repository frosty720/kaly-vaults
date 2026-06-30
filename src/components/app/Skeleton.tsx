'use client';

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
	return (
		<div
			className={`glass animate-pulse rounded-md ${className}`}
			aria-hidden="true"
		/>
	);
}
