import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Panel } from "@repo/ui/panel";

export function StatCard({
	label,
	value,
	hint,
	icon,
	hintAccent,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	icon?: ReactNode;
	hintAccent?: ReactNode;
}) {
	return (
		<Panel className="group lift flex flex-col p-6">
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-medium text-ink">{label}</p>
				{icon && (
					<span
						className="grid size-6 place-items-center rounded-[4px] bg-elevated text-primary transition-transform duration-300 group-hover:scale-110 [&_svg]:size-3.5"
						aria-hidden
					>
						{icon}
					</span>
				)}
			</div>
			<p className="mt-7 font-display text-3xl font-bold tracking-[-0.02em] text-ink">{value}</p>
			{hint && (
				<p className="mt-4 flex items-center gap-1.5 text-[10px] text-muted">
					{hintAccent ?? <ArrowUpRight className="size-3 text-primary" />}
					{hint}
				</p>
			)}
		</Panel>
	);
}
