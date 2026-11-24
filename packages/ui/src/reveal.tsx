"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { cn } from "./lib/utils";

/**
 * Fades its content up the first time it scrolls into view (IntersectionObserver).
 * Content above the fold reveals immediately; reduced-motion users see it static.
 */
export function Reveal({
	children,
	delay = 0,
	as: Tag = "div",
	className,
}: {
	children: ReactNode;
	delay?: number;
	as?: ElementType;
	className?: string;
}) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (!("IntersectionObserver" in window)) {
			el.dataset.visible = "true";
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						(entry.target as HTMLElement).dataset.visible = "true";
						observer.unobserve(entry.target);
					}
				}
			},
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<Tag ref={ref} className={cn("reveal", className)} style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}>
			{children}
		</Tag>
	);
}
