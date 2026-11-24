import { Check } from "lucide-react";
import { cn } from "./lib/utils";

/**
 * Progress tracker from the design: done steps are mint checks, the current
 * step is outlined with a pulse, and the connector fills as progress moves.
 * `done` = number of completed steps; `complete` marks every step done.
 */
export function Stepper({
	labels,
	done,
	complete,
	compact,
	label = "Progress",
	className,
}: {
	labels: string[];
	done: number;
	complete?: boolean;
	compact?: boolean;
	label?: string;
	className?: string;
}) {
	const last = labels.length - 1;
	const current = Math.min(done, last);
	const progress = (Math.min(done, last) / last) * 100;
	const inset = `calc(100% / ${labels.length * 2})`;

	return (
		<div className={cn("relative", className)}>
			{/* Track + animated fill, spanning first to last circle centre */}
			<div className={cn("absolute", compact ? "top-3" : "top-4 sm:top-5")} style={{ left: inset, right: inset }} aria-hidden>
				<div className="h-px bg-line" />
				<div
					className="absolute top-0 left-0 h-px origin-left animate-grow-x bg-primary transition-[width] duration-700 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<ol
				className="relative grid"
				style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
				aria-label={label}
			>
				{labels.map((text, i) => {
					const isDone = i < done || !!complete;
					const isCurrent = i === current && !complete;
					return (
						<li key={text} className="flex flex-col items-center gap-2 text-center" aria-current={isCurrent ? "step" : undefined}>
							<span
								className={cn(
									"relative grid place-items-center rounded-full border text-[11px] font-semibold transition-colors duration-300",
									compact ? "size-6" : "size-8 sm:size-10 sm:text-xs",
									isDone && "border-primary bg-primary text-on-primary",
									isDone && i === 0 && "border-highlight bg-highlight",
									isCurrent && "border-primary bg-primary/15 text-primary",
									!isDone && !isCurrent && "border-line bg-canvas text-muted",
								)}
							>
								{isCurrent && (
									<span className="absolute inset-0 animate-pulse-ring rounded-full border border-primary" aria-hidden />
								)}
								{isDone ? <Check className={compact ? "size-3" : "size-3.5 sm:size-4"} strokeWidth={3} /> : i + 1}
							</span>
							<span
								className={cn(
									"text-[10px] leading-tight sm:text-xs",
									isDone || isCurrent ? "font-semibold text-ink" : "text-muted",
									compact && "text-[9px] sm:text-[10px]",
								)}
							>
								{text}
							</span>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
