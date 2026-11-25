import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/utils";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
	primary:
		"shine bg-primary text-on-primary hover:bg-primary-strong shadow-[0_0_0_0_rgb(45_212_168/0)] hover:shadow-[0_6px_24px_-8px_rgb(45_212_168/0.6)]",
	secondary: "border border-line bg-canvas text-ink hover:border-subtle hover:bg-elevated",
	ghost: "text-muted hover:bg-elevated hover:text-ink",
	outline: "border border-primary/60 bg-primary/10 text-primary hover:bg-primary/15",
	danger: "border border-attention/50 bg-attention/10 text-attention hover:bg-attention/20",
};

const sizes: Record<Size, string> = {
	sm: "min-h-8 px-3 py-1.5 text-xs gap-1.5 [&_svg]:size-3.5",
	md: "min-h-9 px-4 py-2 text-sm gap-2 [&_svg]:size-4",
	lg: "min-h-11 px-5 py-2.5 text-[15px] gap-2 [&_svg]:size-[18px]",
};

interface Common {
	variant?: Variant;
	size?: Size;
	icon?: ReactNode;
	iconRight?: ReactNode;
	loading?: boolean;
	loadingText?: string;
	fullWidth?: boolean;
}

export function buttonClasses({
	variant = "primary",
	size = "md",
	fullWidth,
}: Pick<Common, "variant" | "size" | "fullWidth"> = {}) {
	return cn(
		// Never wider than its container: a long label wraps onto a second line (the button grows taller) instead of
		// spilling out on narrow screens. On wide screens labels stay on one line as before.
		"group/btn relative inline-flex max-w-full min-w-0 select-none items-center justify-center rounded-[var(--radius-sm)] text-center leading-tight font-medium [text-wrap:balance] [&_svg]:shrink-0",
		"transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98]",
		"disabled:pointer-events-none disabled:opacity-45",
		variants[variant],
		sizes[size],
		fullWidth && "w-full",
	);
}

export function Button({
	variant,
	size,
	icon,
	iconRight,
	loading,
	loadingText,
	fullWidth,
	className,
	children,
	disabled,
	type = "button",
	...props
}: Common & ComponentProps<"button">) {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={cn(buttonClasses({ variant, size, fullWidth }), className)}
			{...props}
		>
			{loading ? <Spinner /> : icon}
			{loading && loadingText ? loadingText : children}
			{!loading && iconRight && (
				<span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">{iconRight}</span>
			)}
		</button>
	);
}

export function ButtonLink({
	variant,
	size,
	icon,
	iconRight,
	fullWidth,
	className,
	children,
	...props
}: Omit<Common, "loading" | "loadingText"> & ComponentProps<typeof Link>) {
	return (
		<Link className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...props}>
			{icon}
			{children}
			{iconRight && <span className="transition-transform duration-200 group-hover/btn:translate-x-0.5">{iconRight}</span>}
		</Link>
	);
}
