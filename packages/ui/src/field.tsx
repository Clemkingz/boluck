import type { ComponentProps, ReactNode } from "react";
import { cn } from "./lib/utils";

const control =
	"w-full rounded-[var(--radius-sm)] border border-line bg-canvas px-4 text-sm text-ink placeholder:text-subtle transition-[border-color,box-shadow] duration-150 hover:border-subtle/60 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 disabled:opacity-60 aria-invalid:border-attention aria-invalid:focus:ring-attention/15 read-only:bg-canvas/70";

export function Field({
	label,
	htmlFor,
	hint,
	error,
	optional,
	children,
	className,
}: {
	label: string;
	htmlFor: string;
	hint?: ReactNode;
	error?: string;
	optional?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-2", className)}>
			<div>
				<label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-xs font-semibold text-ink">
					{label}
					{optional && <span className="text-[10px] font-normal text-subtle">Optional</span>}
				</label>
				{hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
			</div>
			{children}
			{error && (
				<p className="animate-fade-in text-xs text-attention" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

export function Input({ className, ...props }: ComponentProps<"input">) {
	return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
	return <textarea className={cn(control, "min-h-24 resize-y py-3 leading-relaxed", className)} {...props} />;
}

/** Custom mint checkbox matching the design. */
export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
	return (
		<input
			type="checkbox"
			className={cn(
				"peer size-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-muted/60 bg-transparent transition-colors",
				"checked:border-primary checked:bg-primary",
				"checked:bg-[url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8.5l2.5 2.5L12 5.5' stroke='%230d1b2a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")]",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
				className,
			)}
			{...props}
		/>
	);
}
