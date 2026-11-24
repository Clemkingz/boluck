import type { ReactNode } from "react";
import { cn } from "./lib/utils";

/**
 * Shared layout for 404 / error screens: a big code, a broken-escrow
 * illustration, headline, explanation and actions.
 */
export function StatusScreen({
	code,
	title,
	description,
	actions,
	detail,
	tone = "primary",
	className,
}: {
	code: string;
	title: string;
	description: ReactNode;
	actions?: ReactNode;
	detail?: ReactNode;
	tone?: "primary" | "attention";
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col items-center text-center", className)}>
			<div className="relative animate-fade-up">
				<span
					className={cn(
						"font-display text-[96px] leading-none font-bold tracking-[-0.04em] text-transparent sm:text-[140px]",
						tone === "primary"
							? "[-webkit-text-stroke:1.5px_var(--color-primary)]"
							: "[-webkit-text-stroke:1.5px_var(--color-attention)]",
					)}
					aria-hidden
				>
					{code}
				</span>
				<BrokenSeal tone={tone} />
			</div>
			<h1 className="mt-6 animate-fade-up font-display text-2xl font-bold tracking-[-0.02em] text-ink [animation-delay:80ms] sm:text-3xl">
				{title}
			</h1>
			<div className="mt-3 max-w-md animate-fade-up text-sm leading-relaxed text-muted [animation-delay:140ms] sm:text-base">
				{description}
			</div>
			{actions && (
				<div className="mt-8 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:200ms]">{actions}</div>
			)}
			{detail && <div className="mt-6 animate-fade-in [animation-delay:300ms]">{detail}</div>}
		</div>
	);
}

function BrokenSeal({ tone }: { tone: "primary" | "attention" }) {
	const color = tone === "primary" ? "var(--color-primary)" : "var(--color-attention)";
	return (
		<span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 animate-float place-items-center rounded-full border border-line bg-surface shadow-[var(--shadow-pop)] sm:size-20">
			<svg viewBox="0 0 24 24" className="size-7 sm:size-9" fill="none" aria-hidden>
				<path
					d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6l7-3z"
					stroke={color}
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>
				<path
					d="M10.2 9.2l1.8 2.3-1.6 1.6 1.9 2.7"
					stroke={color}
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</span>
	);
}
