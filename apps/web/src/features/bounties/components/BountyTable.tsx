import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate, formatUsd } from "@repo/stellar/format";
import type { Bounty } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";
import { BountyIcon } from "./BountyIcon";
import { StatusBadge } from "./StatusBadge";

/**
 * Responsive bounty list. A table-like grid when its container is wide, stacked
 * rows when narrow (container queries, so it adapts inside any column).
 */
export function BountyTable({
	bounties,
	header = true,
	trailingIcon,
	className,
}: {
	bounties: Bounty[];
	header?: boolean;
	trailingIcon?: boolean;
	className?: string;
}) {
	const cols = trailingIcon
		? "@xl:grid-cols-[minmax(0,1fr)_110px_120px_120px_32px]"
		: "@xl:grid-cols-[minmax(0,1fr)_110px_110px_110px]";
	return (
		<div className={cn("@container", className)}>
			{header && (
				<div
					className={cn(
						"hidden gap-4 border-b border-line px-4 py-4 text-[10px] font-semibold tracking-wide text-ink uppercase @xl:grid",
						cols,
					)}
				>
					<span>Bounty</span>
					<span>Reward</span>
					<span>Due date</span>
					<span>Status</span>
					{trailingIcon && <span />}
				</div>
			)}
			<ul className="stagger divide-y divide-line">
				{bounties.map((b) => (
					<li key={b.id}>
						<Link
							href={`/bounties/${b.id}`}
							className={cn(
								"group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-elevated/60 @xl:py-5",
								cols,
							)}
						>
							<div className="flex min-w-0 items-center gap-3">
								<BountyIcon icon={b.icon} />
								<div className="min-w-0">
									<p className="truncate text-xs font-semibold text-ink transition-colors group-hover:text-primary sm:text-[13px]">
										{b.title}
									</p>
									<p className="mt-1 truncate text-[10px] text-muted">
										{b.project} · {b.id}
									</p>
								</div>
							</div>
							<span className="text-right text-xs font-semibold text-ink tabular-nums @xl:text-left">
								{formatUsd(b.rewardAmount)} <span className="text-[10px] font-normal text-muted">USDC</span>
							</span>
							<span className="text-[11px] text-muted">{formatDate(b.deadline)}</span>
							<span className="justify-self-end @xl:justify-self-start">
								<StatusBadge status={b.status} />
							</span>
							{trailingIcon && (
								<ExternalLink
									className="hidden size-4 text-muted transition-colors group-hover:text-primary @xl:block"
									aria-hidden
								/>
							)}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
