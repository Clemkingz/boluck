"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "./lib/utils";
import { toast } from "./toast";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(value);
					setCopied(true);
					toast.success("Copied to clipboard");
					setTimeout(() => setCopied(false), 1500);
				} catch {
					toast.error("Couldn't copy", { description: "Your browser blocked clipboard access." });
				}
			}}
			className={cn("shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-ink", className)}
			aria-label={copied ? "Copied" : label}
			title={copied ? "Copied" : label}
		>
			{copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
		</button>
	);
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex animate-fade-up flex-col items-center px-6 py-14 text-center", className)}>
			{icon && (
				<div className="mb-4 grid size-10 animate-bob place-items-center rounded-[var(--radius-sm)] bg-deep text-primary [&_svg]:size-5">
					{icon}
				</div>
			)}
			<p className="font-display text-sm font-bold text-ink">{title}</p>
			{description && <p className="mt-1.5 max-w-sm text-xs text-muted">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn("skeleton rounded-[var(--radius-md)]", className)} aria-hidden />;
}

/** The small uppercase mint line above page titles. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
	return <p className={cn("text-xs font-semibold tracking-wide text-primary uppercase sm:text-sm", className)}>{children}</p>;
}

export function Notice({
	tone = "neutral",
	icon,
	title,
	children,
	className,
}: {
	tone?: "neutral" | "review" | "attention" | "primary";
	icon?: ReactNode;
	title?: ReactNode;
	children?: ReactNode;
	className?: string;
}) {
	const tones = {
		neutral: "border-line bg-surface text-muted",
		review: "border-review/70 bg-review/8 text-muted",
		attention: "border-attention/70 bg-attention/10 text-muted",
		primary: "border-primary/50 bg-primary/10 text-muted",
	};
	const iconTone = { neutral: "text-primary", review: "text-review", attention: "text-attention", primary: "text-primary" };
	return (
		<div className={cn("flex gap-3 rounded-[var(--radius-md)] border p-4 text-xs leading-relaxed", tones[tone], className)}>
			{icon && <span className={cn("mt-px shrink-0 [&_svg]:size-4", iconTone[tone])}>{icon}</span>}
			<div className="min-w-0">
				{title && <p className="mb-1 text-sm font-semibold text-ink">{title}</p>}
				{children}
			</div>
		</div>
	);
}

/** Mint check bullet list ("What success looks like"). */
export function CheckList({ items, className }: { items: string[]; className?: string }) {
	return (
		<ul className={cn("space-y-3", className)}>
			{items.map((item) => (
				<li key={item} className="flex items-start gap-2.5 text-xs font-medium text-ink">
					<svg viewBox="0 0 20 20" className="mt-px size-4 shrink-0 text-primary" fill="none" aria-hidden>
						<circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
						<path
							d="M6.5 10.2l2.3 2.3 4.7-4.8"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{item}
				</li>
			))}
		</ul>
	);
}
