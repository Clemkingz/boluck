"use client";

import { ArrowRight, Flag } from "lucide-react";
import Link from "next/link";
import type { BountyStatus } from "@repo/stellar/bounty";
import { STATUS_META } from "@repo/stellar/status";
import { cn } from "@repo/ui/lib/utils";
import { admin, type BountyFlag } from "@/lib/api/admin";
import { Amount, ErrorNote, Loading, PageHeader, Section, Stat, useApi } from "@/components/ui";

/** What each attention flag means, and why an operator should look. */
export const FLAGS: Record<BountyFlag, { label: string; hint: string }> = {
	auto_release_failed: { label: "Auto-release failed", hint: "The last automatic payout attempt failed." },
	review_overdue: { label: "Review overdue", hint: "Review or release time has passed." },
	cancel_requested: { label: "Cancellation pending", hint: "Waiting on the other party to confirm." },
	recovery_soon: { label: "Recovery soon", hint: "Escrow recovery date is close." },
	past_recovery: { label: "Past recovery", hint: "The recovery date has passed; only the issuer can reclaim." },
};

const ORDER: BountyStatus[] = [
	"draft",
	"funded",
	"assigned",
	"in_progress",
	"submitted",
	"revision_requested",
	"approved",
	"paid",
	"cancelled",
	"refunded",
];
const BAR: Record<string, string> = {
	primary: "bg-primary",
	highlight: "bg-highlight",
	active: "bg-active",
	review: "bg-review",
	attention: "bg-attention",
	neutral: "bg-muted",
};

export function Overview() {
	const { data, error, loading, reload } = useApi(admin.overview, "overview");

	return (
		<>
			<PageHeader title="Overview" description="Platform totals, money held in escrow, and anything that needs an operator." />
			{error && <ErrorNote message={error} onRetry={reload} />}
			{loading && !data && <Loading rows={6} />}
			{data && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
						<Stat label="Bounties" value={data.bounties.total} hint={`${data.wallets} wallets involved`} href="/bounties" />
						<Stat
							label="Locked in escrow"
							value={<Amount value={data.funds.locked} asset={data.funds.asset} />}
							hint={`${data.funds.openBalances} open balances`}
							tone="primary"
						/>
						<Stat
							label="Under review"
							value={<Amount value={data.funds.underReview} asset={data.funds.asset} />}
							hint={`${data.bounties.byStatus.submitted} submitted`}
							href="/bounties?status=submitted"
						/>
						<Stat
							label="Paid out"
							value={<Amount value={data.funds.paid} asset={data.funds.asset} />}
							hint={`${data.funds.paidAutomatically} automatically`}
							href="/bounties?status=paid"
						/>
					</div>

					<div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
						<Section title="Needs attention">
							<ul className="divide-y divide-line">
								{(Object.keys(FLAGS) as BountyFlag[]).map((flag) => {
									const n = data.bounties.needsAttention[flag] ?? 0;
									return (
										<li key={flag}>
											<Link href={`/bounties?flag=${flag}`} className="group flex items-center gap-3 py-3">
												<Flag className={cn("size-4 shrink-0", n ? "text-attention" : "text-muted")} />
												<span className="min-w-0 flex-1">
													<span className="block text-sm font-medium text-ink">{FLAGS[flag].label}</span>
													<span className="block text-[10px] text-muted">{FLAGS[flag].hint}</span>
												</span>
												<span className={cn("font-display text-lg font-bold tabular-nums", n ? "text-attention" : "text-muted")}>
													{n}
												</span>
												<ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
											</Link>
										</li>
									);
								})}
							</ul>
						</Section>

						<Section title="Transactions">
							<div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
								<Stat
									label="Stuck (pending > 5 min)"
									value={data.transactions.stuck}
									tone={data.transactions.stuck ? "attention" : undefined}
									href="/transactions?stuck=1"
								/>
								<Stat
									label="Pending"
									value={data.transactions.pending}
									tone={data.transactions.pending ? "review" : undefined}
									href="/transactions?status=pending"
								/>
								<Stat
									label="Failed · last 24 h"
									value={data.transactions.failedLast24Hours}
									tone={data.transactions.failedLast24Hours ? "attention" : undefined}
									href="/transactions?status=failed"
								/>
								<Stat
									label="Recorded, not applied"
									value={data.transactions.rejected}
									hint="Late signatures after a bounty moved on"
									href="/transactions?rejected=1"
								/>
							</div>
							<p className="mt-3 text-[10px] text-muted">
								{data.transactions.confirmed} confirmed · {data.transactions.expired} expired · {data.transactions.prepared}{" "}
								prepared
							</p>
						</Section>
					</div>

					<div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] [&>*]:min-w-0">
						<Section title="Bounties by status">
							<ul className="space-y-2.5">
								{ORDER.map((s) => {
									const n = data.bounties.byStatus[s] ?? 0;
									const pct = data.bounties.total ? (n / data.bounties.total) * 100 : 0;
									return (
										<li key={s}>
											<Link
												href={`/bounties?status=${s}`}
												className="group grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_2rem] items-center gap-3 text-xs"
											>
												<span className="truncate text-ink group-hover:text-primary">{STATUS_META[s].label}</span>
												<span className="h-2 overflow-hidden rounded-full bg-elevated">
													<span
														className={cn("block h-full origin-left animate-grow-x rounded-full", BAR[STATUS_META[s].tone])}
														style={{ width: `${pct}%` }}
													/>
												</span>
												<span className="text-right tabular-nums text-muted">{n}</span>
											</Link>
										</li>
									);
								})}
							</ul>
						</Section>
						<Section title="Funds">
							<dl className="divide-y divide-line text-sm">
								{[
									["Locked in escrow", data.funds.locked],
									["Approved, awaiting release", data.funds.awaitingRelease],
									["Under review", data.funds.underReview],
									["Paid to contributors", data.funds.paid],
									["Refunded to issuers", data.funds.refunded],
								].map(([label, value]) => (
									<div key={label} className="flex items-center justify-between gap-3 py-2.5">
										<dt className="text-muted">{label}</dt>
										<dd className="text-right font-medium text-ink">
											<Amount value={value} asset={data.funds.asset} />
										</dd>
									</div>
								))}
							</dl>
						</Section>
					</div>
				</div>
			)}
		</>
	);
}
