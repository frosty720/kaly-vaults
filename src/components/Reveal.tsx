'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
	children: ReactNode;
	/** Stagger delay in milliseconds. */
	delay?: number;
	className?: string;
}

export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setVisible(true);
						observer.disconnect();
						break;
					}
				}
			},
			{ threshold: 0.2 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			className={`reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
			style={delay ? { transitionDelay: `${delay}ms` } : undefined}
		>
			{children}
		</div>
	);
}
