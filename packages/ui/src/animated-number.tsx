"use client";

import { useEffect, useState } from "react";

/** Animates a number from 0 to `value` once on mount (and on change). */
export function CountUp({ value, format, duration = 900 }: { value: number; format: (n: number) => string; duration?: number }) {
	const [shown, setShown] = useState(0);

	useEffect(() => {
		const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : duration;
		let frame = 0;
		const start = performance.now();
		const from = 0;
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / length);
			const eased = 1 - Math.pow(1 - t, 3);
			setShown(from + (value - from) * eased);
			if (t < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [value, duration]);

	return <span className="tabular-nums">{format(Math.round(shown))}</span>;
}
