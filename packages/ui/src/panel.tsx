import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/utils";

/** The bordered surface card used throughout the designs. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
	return <section className={cn("rounded-[var(--radius-md)] border border-line bg-surface", className)} {...props} />;
}

export function PanelTitle({
	title,
	description,
	icon,
	action,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-start justify-between gap-4", className)}>
			<div className="flex min-w-0 items-start gap-3">
				{icon}
				<div className="min-w-0">
					<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">{title}</h2>
					{description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
				</div>
			</div>
			{action}
		</div>
	);
}

/** Rounded square with a soft accent fill, used for icons beside titles. */
export function IconTile({
	children,
	size = "md",
	tone = "deep",
	className,
}: {
	children: ReactNode;
	size?: "sm" | "md" | "lg";
	tone?: "deep" | "elevated" | "primary";
	className?: string;
}) {
	return (
		<span
			className={cn(
				"grid shrink-0 place-items-center rounded-[var(--radius-sm)] text-primary",
				size === "sm" && "size-8 [&_svg]:size-4",
				size === "md" && "size-10 [&_svg]:size-5",
				size === "lg" && "size-12 [&_svg]:size-6",
				tone === "deep" && "bg-deep",
				tone === "elevated" && "border border-line bg-elevated text-muted",
				tone === "primary" && "bg-primary/15",
				className,
			)}
			aria-hidden
		>
			{children}
		</span>
	);
}

export function DetailRows({ rows, className }: { rows: { label: string; value: ReactNode }[]; className?: string }) {
	return (
		<dl className={cn("space-y-0", className)}>
			{rows.map((r) => (
				<div key={r.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
					<dt className="text-muted">{r.label}</dt>
					<dd className="min-w-0 truncate text-right font-medium text-ink">{r.value}</dd>
				</div>
			))}
		</dl>
	);
}
