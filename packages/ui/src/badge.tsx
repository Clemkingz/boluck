import type { ReactNode } from "react";
import { cn } from "./lib/utils";

export type Tone = "neutral" | "primary" | "highlight" | "active" | "review" | "attention";

const tones: Record<Tone, string> = {
	neutral: "bg-muted/15 text-muted",
	primary: "bg-primary/15 text-primary",
	highlight: "bg-highlight/15 text-highlight",
	active: "bg-active/15 text-active",
	review: "bg-review/15 text-review",
	attention: "bg-attention/15 text-attention",
};

export function Badge({
	tone = "neutral",
	dot = true,
	pulse,
	children,
	className,
}: {
	tone?: Tone;
	dot?: boolean;
	/** Pulse the dot for live states (in progress, in review). */
	pulse?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap",
				tones[tone],
				className,
			)}
		>
			{dot && <span className={cn("size-1.5 rounded-full bg-current", pulse && "animate-dot-pulse")} aria-hidden />}
			{children}
		</span>
	);
}
