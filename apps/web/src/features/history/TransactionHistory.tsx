"use client";

import { ArrowRight, Download, Filter, Timer } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BountyIcon } from "@/features/bounties/components/BountyIcon";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { CountUp } from "@repo/ui/animated-number";
import { CopyButton, EmptyState } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { txReference } from "@repo/stellar/network";
import { formatDateTime, formatUsd, shortAddress } from "@repo/stellar/format";
import type { Transaction } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { useMyTransactions, useRoleBounties } from "@/features/escrow/hooks";
import { toast } from "@repo/ui/toast";

const TABS = [
	{ id: "all", label: "All", types: ["fund", "payout", "refund"] },
	{ id: "payouts", label: "Payouts", types: ["payout"] },
	{ id: "escrow", label: "Escrow", types: ["fund"] },
	{ id: "refunds", label: "Refunds", types: ["refund"] },
] as const;

const TYPE_LABEL = { fund: "Escrow", payout: "Payout", refund: "Refund" } as Record<string, string>;
const TYPE_TONE = { fund: "text-active", payout: "text-primary", refund: "text-attention" } as Record<string, string>;

export function HistoryView() {
	const txs = useMyTransactions();
	const bounties = useAppStore((s) => s.bounties);
	const address = useAppStore((s) => s.wallet?.address);
	const mine = useRoleBounties();
	const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

	const money = useMemo(() => txs.filter((t) => ["fund", "payout", "refund"].includes(t.type)), [txs]);
	const visible = money.filter((t) => (tab.types as readonly string[]).includes(t.type));
	const byId = useMemo(() => new Map(bounties.map((b) => [b.id, b])), [bounties]);

	const paidOut = money.filter((t) => t.type === "payout" && t.status === "success").reduce((s, t) => s + (t.amount ?? 0), 0);
	const refunded = money.filter((t) => t.type === "refund" && t.status === "success").reduce((s, t) => s + (t.amount ?? 0), 0);
	const awaiting = mine.filter((b) => b.status === "submitted" || b.status === "approved");

	const counterparty = (t: Transaction) => {
		const other = t.type === "fund" ? (byId.get(t.bountyId)?.contributor ?? t.from) : (t.to ?? t.from);
		return other === address ? "You" : shortAddress(other);
	};

	const exportCsv = () => {
		const rows = [
			["reference", "hash", "bounty", "type", "amount_usdc", "from", "to", "ledger", "timestamp", "status"],
			...visible.map((t) => [
				txReference(t),
				t.hash,
				t.bountyId,
				t.type,
				t.amount ?? "",
				t.from,
				t.to ?? "",
				t.ledger,
				t.timestamp,
				t.status,
			]),
		];
		const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
		const a = Object.assign(document.createElement("a"), { href: url, download: `boluck-${tab.id}-history.csv` });
		a.click();
		URL.revokeObjectURL(url);
		toast.success("History exported", { description: `${visible.length} transactions saved as CSV.` });
	};

	return (
		<>
			<PageHeader
				eyebrow="Every payment, traceable"
				title="History you can trust."
				description="Every payout, escrow deposit, and refund with its recipient wallet and demo transaction reference."
				actions={
					<Button variant="secondary" size="sm" icon={<Download />} onClick={exportCsv} disabled={!visible.length}>
						Export CSV
					</Button>
				}
			/>

			<div className="stagger grid grid-cols-3 gap-3 sm:gap-6">
				<Stat label="Paid out" value={<CountUp value={paidOut} format={formatUsd} />} />
				<Stat label="Refunded" value={<CountUp value={refunded} format={formatUsd} />} />
				<Stat
					label="Awaiting payout"
					value={
						<>
							<CountUp value={awaiting.length} format={String} />{" "}
							<span className="font-sans text-xl font-normal text-muted">bounties</span>
						</>
					}
				/>
			</div>

			{awaiting[0] && (
				<Link
					href={`/bounties/${awaiting[0].id}`}
					className="mt-6 flex animate-fade-up items-center gap-3 rounded-[var(--radius-md)] border border-review bg-review/10 px-5 py-4 transition-colors hover:bg-review/15 sm:px-6"
				>
					<Timer className="size-6 shrink-0 text-review" />
					<span className="min-w-0 flex-1 text-sm text-muted sm:text-base">
						<span className="font-semibold text-ink">{awaiting[0].title}</span> · Awaiting issuer review
					</span>
					<span className="font-display text-base font-bold text-ink">{formatUsd(awaiting[0].rewardAmount)}</span>
				</Link>
			)}

			<div className="mt-6 flex flex-wrap gap-3 sm:gap-4" role="tablist" aria-label="Filter transactions">
				{TABS.map((t) => (
					<button
						key={t.id}
						role="tab"
						aria-selected={tab.id === t.id}
						onClick={() => setTab(t)}
						className={cn(
							"h-7 rounded-full border px-4 text-sm transition-all duration-200",
							tab.id === t.id ? "border-primary bg-primary/15 text-primary" : "border-line text-ink hover:border-subtle",
						)}
					>
						{t.label}
					</button>
				))}
			</div>

			<Panel className="mt-6 overflow-hidden">
				<div className="hidden grid-cols-[minmax(0,1.6fr)_90px_110px_minmax(0,1.3fr)_70px] gap-4 border-b border-line px-6 py-4 text-[10px] font-medium text-ink uppercase md:grid">
					<span>Bounty</span>
					<span className="text-right">Amount</span>
					<span>Wallet</span>
					<span>Transaction references</span>
					<span>Type</span>
				</div>
				{visible.length === 0 ? (
					<EmptyState
						icon={<Filter />}
						title="No transactions yet"
						description="Payouts, escrow deposits, and refunds appear here."
						action={
							<ButtonLink href="/bounties" size="sm" variant="secondary" iconRight={<ArrowRight />}>
								Explore bounties
							</ButtonLink>
						}
					/>
				) : (
					<ul key={tab.id} className="stagger divide-y divide-line">
						{visible.map((t) => {
							const b = byId.get(t.bountyId);
							const ref = txReference(t);
							return (
								<li
									key={t.hash}
									className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_90px_110px_minmax(0,1.3fr)_70px] md:px-6 md:py-5"
								>
									<Link href={`/bounties/${t.bountyId}`} className="group flex min-w-0 items-center gap-3">
										{b && <BountyIcon icon={b.icon} />}
										<span className="min-w-0">
											<span className="block truncate text-xs font-semibold text-ink group-hover:text-primary">
												{b?.title ?? t.bountyId}
											</span>
											<span className="mt-1 block text-[10px] text-muted">
												{t.bountyId} · {formatDateTime(t.timestamp)}
											</span>
										</span>
									</Link>
									<span
										className={cn(
											"text-right text-xs font-semibold tabular-nums",
											t.status === "failed" ? "text-attention line-through" : "text-ink",
										)}
									>
										{formatUsd(t.amount ?? 0)}
									</span>
									<span className="text-[10px] text-muted">
										<span className="md:hidden">Wallet · </span>
										{counterparty(t)}
									</span>
									<span className="order-last col-span-2 flex min-w-0 items-center gap-1 md:order-none md:col-span-1">
										<span className="truncate font-mono text-[10px] text-primary" title={t.hash}>
											{ref}
										</span>
										<CopyButton value={ref} label="Copy reference" className="p-0.5 [&_svg]:size-3" />
									</span>
									<span className={cn("text-right text-[10px] font-medium md:text-left", TYPE_TONE[t.type])}>
										{TYPE_LABEL[t.type]}
										{t.status === "failed" && <span className="text-attention"> · failed</span>}
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</Panel>

			<Panel className="mt-6 flex items-center gap-4 px-6 py-5">
				<Timer className="size-6 shrink-0 text-primary" />
				<p className="text-xs text-muted sm:text-[13px]">
					References on this page come from a front-end demo. They are not Stellar transaction IDs or on-chain payments.
				</p>
			</Panel>
		</>
	);
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<Panel className="p-4 sm:p-6">
			<p className="text-[10px] text-ink uppercase sm:text-sm">{label}</p>
			<p className="mt-3 font-display text-xl font-bold text-ink sm:mt-6 sm:text-3xl [&_span.font-sans]:text-xs sm:[&_span.font-sans]:text-xl">
				{value}
			</p>
		</Panel>
	);
}
