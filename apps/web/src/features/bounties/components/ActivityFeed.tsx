"use client";

import {
	Ban,
	CheckCircle2,
	CircleDollarSign,
	ExternalLink,
	FilePlus2,
	Hourglass,
	Lock,
	RotateCcw,
	Send,
	Timer,
	Undo2,
	UserPlus,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { TX_META } from "@repo/stellar/status";
import { formatAmount, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES } from "@/lib/api/mock-data";
import type { Bounty, Transaction, TxType } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";

const ICONS: Record<TxType, LucideIcon> = {
	create: FilePlus2,
	fund: Lock,
	assign: UserPlus,
	accept: Timer,
	submit: Send,
	approve: CheckCircle2,
	request_revision: RotateCcw,
	payout: CircleDollarSign,
	cancel: Ban,
	refund: Undo2,
	cancel_request: Hourglass,
	cancel_withdraw: Undo2,
};

const VERB: Record<TxType, string> = {
	create: "created",
	fund: "funded",
	assign: "assigned a contributor to",
	accept: "accepted",
	submit: "submitted work for",
	approve: "approved",
	request_revision: "requested a revision on",
	payout: "released payment for",
	cancel: "cancelled",
	refund: "refunded",
	cancel_request: "asked to cancel",
	cancel_withdraw: "withdrew the cancellation request on",
};

function when(iso: string) {
	// Whole calendar days (UTC) between the event and today.
	const day = (d: Date) => Math.floor(d.getTime() / 86_400_000);
	const days = day(new Date()) - day(new Date(iso));
	if (days <= 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return "Earlier this week";
	return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

/** "GB7K…4M2P submitted work for Build contributor onboarding flow" */
export function ActivityFeed({
	transactions,
	bounties,
	me,
	limit,
	className,
}: {
	transactions: Transaction[];
	bounties: Bounty[];
	me?: string;
	limit?: number;
	className?: string;
}) {
	const items = limit ? transactions.slice(0, limit) : transactions;
	if (items.length === 0) return <p className="py-8 text-center text-xs text-muted">No activity yet.</p>;
	const titles = new Map(bounties.map((b) => [b.id, b.title]));

	return (
		<ol className={cn("stagger divide-y divide-line", className)}>
			{items.map((t) => {
				const Icon = ICONS[t.type];
				// Refunds and automatic releases are paid out by the escrow itself, with no actor.
				const who = !t.from ? "Escrow" : t.from === me ? "You" : shortAddress(t.from);
				const failed = t.status === "failed";
				return (
					<li key={t.id ?? t.hash} className="flex gap-3 py-4 first:pt-0 last:pb-0">
						<span
							className={cn(
								"grid size-8 shrink-0 place-items-center rounded-full border bg-canvas",
								failed ? "border-attention/50 text-attention" : "border-line text-primary",
							)}
						>
							<Icon className="size-4" aria-hidden />
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-xs leading-relaxed font-semibold text-ink">
								<span title={ACCOUNT_NAMES[t.from]}>{who}</span> {VERB[t.type]}{" "}
								<Link href={`/bounties/${t.bountyId}`} className="transition-colors hover:text-primary">
									{titles.get(t.bountyId) ?? t.bountyId}
								</Link>
								{t.amount && (t.type === "fund" || t.type === "payout" || t.type === "refund") ? (
									<span className="font-normal text-muted"> · {formatAmount(t.amount)}</span>
								) : null}
								{failed && <span className="text-attention"> · failed</span>}
							</p>
							<p className="mt-1 text-[10px] text-muted">
								{when(t.timestamp)} · {t.bountyId} · {TX_META[t.type].label}
								{t.explorerUrl && (
									<>
										{" · "}
										<a
											href={t.explorerUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-0.5 text-primary hover:underline"
										>
											Explorer <ExternalLink className="size-2.5" />
										</a>
									</>
								)}
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
