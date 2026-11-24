"use client";

import {
	ArrowDownLeft,
	ArrowRight,
	CircleCheck,
	ExternalLink,
	Fingerprint,
	Hourglass,
	Lock,
	ShieldCheck,
	Undo2,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/features/bounties/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/field";
import { EmptyState } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { cancellationPath, type CancelRule } from "@repo/stellar/escrow";
import { formatAmount, formatDate, formatDateTime, formatUsd, shortAddress } from "@repo/stellar/format";
import { TX_META } from "@repo/stellar/status";
import type { ActionKind, Bounty } from "@repo/stellar/bounty";
import { LIVE } from "@/lib/api/config";
import { useMyTransactions } from "@/features/escrow/hooks";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";

const RULES: { rule: CancelRule; label: string }[] = [
	{ rule: "unfunded", label: "Unfunded bounties can be cancelled" },
	{ rule: "unassigned", label: "Funded, unassigned bounties may be refunded" },
	{ rule: "assigned", label: "Assigned bounty needs contributor agreement" },
	{ rule: "paid", label: "Paid bounties cannot be cancelled or refunded" },
];

export function RefundsView() {
	const router = useRouter();
	const pathname = usePathname();
	const search = useSearchParams();
	const address = useAppStore((s) => s.wallet?.address);
	const all = useAppStore((s) => s.bounties);
	const bounties = all.filter((b) => b.issuer === address || b.contributor === address);
	const cancellable = (b: Bounty) =>
		LIVE ? !!b.chain?.availableActions.some((a) => CANCEL_ACTIONS.includes(a)) : cancellationPath(b).allowed;
	const selectedId = search.get("bounty") ?? bounties.find(cancellable)?.id ?? bounties[0]?.id;
	const selected = bounties.find((b) => b.id === selectedId);

	const select = (id: string) => router.replace(`${pathname}?bounty=${id}`, { scroll: false });

	return (
		<>
			<PageHeader
				eyebrow="Cancellations, without surprises"
				title="Clear rules. Fair refunds."
				description="A funded promise deserves a predictable way to end. Select a bounty to check what happens before requesting a return."
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
				<Panel className="p-5 sm:p-8">
					<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">Choose a bounty</h2>
					<p className="mt-2 text-sm text-muted">Only eligible escrow can be refunded.</p>
					{bounties.length === 0 ? (
						<EmptyState icon={<Wallet />} title="No bounties yet" description="Bounties you issue or work on will appear here." />
					) : (
						<ul className="stagger mt-6 space-y-4" role="radiogroup" aria-label="Bounty">
							{bounties.map((b) => {
								const active = b.id === selected?.id;
								return (
									<li key={b.id}>
										<button
											role="radio"
											aria-checked={active}
											onClick={() => select(b.id)}
											className={cn(
												"flex w-full items-center gap-4 rounded-[var(--radius-md)] border px-4 py-4 text-left transition-all duration-200 sm:px-6",
												active ? "border-primary bg-deep/50" : "border-line bg-canvas/50 hover:border-subtle",
											)}
										>
											<span
												className={cn(
													"grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)]",
													active ? "bg-deep text-primary" : "bg-elevated text-muted",
												)}
											>
												<Wallet className="size-4" />
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium text-ink">{b.title}</span>
												<span className="mt-0.5 block text-[10px] text-muted">
													{b.id} · {formatUsd(b.rewardAmount)} USDC
												</span>
											</span>
											<StatusBadge status={b.status} />
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</Panel>

				<div className="space-y-6">
					{selected &&
						(LIVE ? (
							<LiveEligibility key={selected.id} bounty={selected} me={address} />
						) : (
							<Eligibility key={selected.id} bounty={selected} isIssuer={selected.issuer === address} />
						))}
				</div>
			</div>
			<RefundHistory />
		</>
	);
}

const CANCEL_ACTIONS: ActionKind[] = ["cancel", "request_cancel", "withdraw_cancel", "confirm_cancel", "reclaim"];

/** Which PRD cancellation rule applies, from the server's status (a contributor named on a draft isn't assigned yet). */
function liveRule(b: Bounty): CancelRule {
	if (b.status === "draft") return "unfunded";
	if (b.status === "funded") return "unassigned";
	if (b.status === "paid") return "paid";
	if (b.status === "cancelled" || b.status === "refunded") return "closed";
	return "assigned";
}

/**
 * Live cancellation & refund: the buttons come from `availableActions`, so the server's rules decide.
 * Assigned bounties need both parties: one requests, the other confirms (or the requester withdraws).
 */
function LiveEligibility({ bounty: b, me }: { bounty: Bounty; me?: string }) {
	const cancelBounty = useAppStore((s) => s.cancelBounty);
	const requestCancel = useAppStore((s) => s.requestCancel);
	const confirmCancel = useAppStore((s) => s.confirmCancel);
	const withdrawCancel = useAppStore((s) => s.withdrawCancel);
	const reclaim = useAppStore((s) => s.reclaim);
	const [busy, setBusy] = useState<ActionKind | null>(null);
	const acts = b.chain?.availableActions ?? [];
	const rule = liveRule(b);
	const requester = b.chain?.cancelRequestedBy;
	const reclaimAt = b.chain?.reclaimAfterAt;
	const refund = rule === "unfunded" ? 0 : b.escrowBalance;

	const run = (kind: ActionKind, fn: (id: string) => Promise<boolean>) => async () => {
		setBusy(kind);
		await fn(b.id);
		setBusy(null);
	};
	const button = (
		kind: ActionKind,
		label: string,
		fn: (id: string) => Promise<boolean>,
		variant: "primary" | "secondary" = "primary",
	) =>
		acts.includes(kind) && (
			<Button
				key={kind}
				fullWidth
				size="lg"
				variant={variant}
				icon={<ArrowDownLeft />}
				loading={busy === kind}
				disabled={!!busy && busy !== kind}
				loadingText="Waiting for your wallet…"
				onClick={run(kind, fn)}
			>
				{label}
			</Button>
		);

	const explanation =
		rule === "closed"
			? b.status === "refunded"
				? "The escrow was returned to the issuer."
				: "This bounty was cancelled before funding."
			: rule === "paid"
				? "Paid bounties can't be cancelled or refunded."
				: requester
					? requester === me
						? "You asked to cancel. Nothing moves until the other party confirms."
						: `${shortAddress(requester)} asked to cancel. If you agree, the escrow returns to the issuer.`
					: rule === "assigned"
						? "An assigned bounty ends only by agreement: either side asks, the other confirms."
						: rule === "unfunded"
							? "Nothing is held in escrow — the bounty can be cancelled."
							: "The full escrow returns to the issuer.";

	const buttons = [
		button("cancel", rule === "unfunded" ? "Cancel bounty" : `Cancel and refund ${formatUsd(refund)} USDC`, (id) =>
			cancelBounty(id, "Cancelled from Refunds & safety", false),
		),
		button("request_cancel", "Request cancellation", requestCancel),
		button("confirm_cancel", `Agree and refund ${formatUsd(b.escrowBalance)} USDC`, confirmCancel),
		button("withdraw_cancel", "Withdraw my request", withdrawCancel, "secondary"),
		button("reclaim", `Reclaim ${formatUsd(b.escrowBalance)} USDC`, reclaim),
	].filter(Boolean);

	return (
		<>
			<Panel className="animate-fade-up p-6">
				<h2 className="flex items-center gap-2 text-base font-semibold text-ink">
					<ShieldCheck className="size-4 text-primary" /> Cancellation eligibility
				</h2>
				<ul className="mt-5 space-y-3">
					{RULES.map((r) => (
						<li
							key={r.rule}
							className={cn(
								"flex items-center gap-2.5 text-[10px] transition-colors",
								r.rule === rule ? "font-semibold text-ink" : "text-muted",
							)}
						>
							{r.rule === rule ? (
								<CircleCheck className="size-4 shrink-0 animate-pop-in fill-primary text-surface" />
							) : (
								<span className="grid size-4 shrink-0 place-items-center">
									<span className="size-1.5 rounded-full bg-muted/70" />
								</span>
							)}
							{r.label}
						</li>
					))}
				</ul>

				{requester && (
					<p
						className="mt-5 flex items-start gap-2 rounded-[var(--radius-md)] border border-review/60 bg-review/10 p-3 text-[10px] text-ink"
						role="status"
					>
						<Hourglass className="mt-px size-4 shrink-0 text-review" />
						{requester === me
							? "Waiting for the other party to confirm your request."
							: "A cancellation request is waiting for you."}
					</p>
				)}

				<div className="mt-6 rounded-[var(--radius-md)] border border-primary bg-deep/40 p-4">
					<p className="text-xs font-semibold text-ink">Refund amount</p>
					<p className="mt-2 font-display text-2xl font-bold text-ink">
						{formatUsd(rule === "closed" || rule === "paid" ? 0 : refund)} <span className="text-base text-muted">USDC</span>
					</p>
					<p className="mt-2 text-[10px] text-muted">{explanation}</p>
				</div>

				<div className="mt-4 space-y-3">
					{buttons.length ? (
						buttons
					) : (
						<p className="rounded-[var(--radius-sm)] border border-line bg-canvas/50 p-3 text-center text-[10px] text-muted">
							No cancellation action is available to your wallet right now.
						</p>
					)}
				</div>
				{reclaimAt && b.issuer === me && !acts.includes("reclaim") && rule !== "closed" && rule !== "paid" && (
					<p className="mt-3 text-[10px] text-muted">
						If the work stalls, you can reclaim the escrow from {formatDate(reclaimAt)}.
					</p>
				)}
				<p className="mt-4 text-[10px] leading-relaxed text-muted">
					Every step is a Stellar transaction signed in your wallet. Refunds go straight from escrow to the issuer.
				</p>
			</Panel>
			<Panel className="p-6">
				<Link href={`/bounties/${b.id}`} className="group inline-flex items-center gap-1 text-[10px] font-medium text-primary">
					Review bounty details <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</Panel>
		</>
	);
}

/** Refund and cancellation transactions for this wallet (client-side filter of the history). */
function RefundHistory() {
	const txs = useMyTransactions().filter((t) => TX_META[t.type].kind === "refund");
	const more = useAppStore((s) => s.more.transactions);
	const loadMore = useAppStore((s) => s.loadMoreTransactions);
	return (
		<Panel className="mt-6 p-5 sm:p-8">
			<h2 className="flex items-center gap-2 font-display text-base font-bold tracking-[-0.02em] text-ink">
				<Undo2 className="size-4 text-primary" /> Refund history
			</h2>
			{txs.length === 0 ? (
				<p className="mt-4 text-xs text-muted">No cancellations or refunds yet.</p>
			) : (
				<ul className="mt-4 divide-y divide-line">
					{txs.map((t) => (
						<li key={t.id ?? t.hash} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-xs">
							<span className="font-medium text-ink">{TX_META[t.type].label}</span>
							<Link href={`/bounties/${t.bountyId}`} className="text-muted hover:text-primary">
								{t.bountyId}
							</Link>
							{t.amount ? <span className="text-ink">{formatAmount(t.amount)}</span> : null}
							<span className="text-[10px] text-muted">{formatDateTime(t.timestamp)}</span>
							{t.explorerUrl && (
								<a
									href={t.explorerUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="ml-auto inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
								>
									Explorer <ExternalLink className="size-3" />
								</a>
							)}
						</li>
					))}
				</ul>
			)}
			{LIVE && more && (
				<Button variant="ghost" size="sm" className="mt-3" onClick={() => void loadMore()}>
					Load older history
				</Button>
			)}
		</Panel>
	);
}

function Eligibility({ bounty, isIssuer }: { bounty: Bounty; isIssuer: boolean }) {
	const cancel = useAppStore((s) => s.cancelBounty);
	const [agreed, setAgreed] = useState(false);
	const [busy, setBusy] = useState(false);
	const path = cancellationPath(bounty);
	const closed = path.rule === "closed";
	const refund = path.needsContributor && !agreed ? 0 : path.refund;

	const reason = !path.allowed
		? path.reason
		: path.needsContributor && !agreed
			? "Contributor agreement is needed for an assigned bounty."
			: path.rule === "unfunded"
				? "Nothing is held in escrow — the bounty can be cancelled."
				: "The full remaining escrow returns to the issuer.";

	return (
		<>
			<Panel className="animate-fade-up p-6">
				<h2 className="flex items-center gap-2 text-base font-semibold text-ink">
					<ShieldCheck className="size-4 text-primary" /> Cancellation eligibility
				</h2>
				<ul className="mt-5 space-y-3">
					{RULES.map((r) => {
						const applies = r.rule === path.rule;
						return (
							<li
								key={r.rule}
								className={cn(
									"flex items-center gap-2.5 text-[10px] transition-colors",
									applies ? "font-semibold text-ink" : "text-muted",
								)}
							>
								{applies ? (
									<CircleCheck className="size-4 shrink-0 animate-pop-in fill-primary text-surface" />
								) : (
									<span className="grid size-4 shrink-0 place-items-center">
										<span className="size-1.5 rounded-full bg-muted/70" />
									</span>
								)}
								{r.label}
							</li>
						);
					})}
					{closed && <li className="text-[10px] font-semibold text-attention">{path.reason}</li>}
				</ul>

				{path.needsContributor && path.allowed && (
					<label className="mt-6 flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-line bg-canvas/60 p-4 transition-colors has-[:checked]:border-primary/60">
						<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
						<span>
							<span className="block text-xs font-semibold text-ink">Contributor agrees to cancel</span>
							<span className="mt-1 block text-[10px] leading-relaxed text-muted">
								This checkbox demonstrates the contributor&apos;s authorization for this prototype only.
							</span>
						</span>
					</label>
				)}

				<div className="mt-6 rounded-[var(--radius-md)] border border-primary bg-deep/40 p-4">
					<p className="text-xs font-semibold text-ink">Refund amount</p>
					<p className="mt-2 font-display text-2xl font-bold text-ink">
						{formatUsd(refund)} <span className="text-base text-muted">USDC</span>
					</p>
					<p className="mt-2 text-[10px] text-muted">{reason}</p>
				</div>

				<Button
					className="mt-4"
					variant={path.allowed && (!path.needsContributor || agreed) && isIssuer ? "primary" : "secondary"}
					fullWidth
					size="lg"
					icon={<ArrowDownLeft />}
					disabled={!isIssuer || !path.allowed || (path.needsContributor && !agreed)}
					loading={busy}
					loadingText="Waiting for your wallet…"
					onClick={async () => {
						setBusy(true);
						await cancel(bounty.id, "Cancelled from Refunds & safety", agreed);
						setBusy(false);
					}}
				>
					{path.rule === "unfunded" ? "Confirm demo cancellation" : "Confirm demo refund"}
				</Button>
				{!isIssuer && path.allowed && (
					<p className="mt-3 text-[10px] text-attention">Only the issuer may cancel or refund this bounty.</p>
				)}
				<p className="mt-4 text-[10px] leading-relaxed text-muted">
					MVP cancellation rules mirror the brief. This demo updates local screen state only and does not return on-chain funds.
				</p>
			</Panel>

			<Panel className="p-6">
				<h2 className="text-sm font-semibold text-ink">What the escrow enforces</h2>
				<ul className="mt-5 space-y-3 text-[10px] text-ink">
					<li className="flex items-center gap-2.5">
						<Lock className="size-4 text-primary" /> Only the issuer may cancel or refund.
					</li>
					<li className="flex items-center gap-2.5">
						<Fingerprint className="size-4 text-primary" /> A paid bounty can never be refunded.
					</li>
					<li className="flex items-center gap-2.5">
						<ShieldCheck className="size-4 text-primary" /> Refunds never exceed remaining escrow.
					</li>
					<li className="flex items-center gap-2.5">
						<CircleCheck className="size-4 text-primary" /> Successful transfers must be verified first.
					</li>
				</ul>
				<Link
					href={`/bounties/${bounty.id}`}
					className="group mt-5 inline-flex items-center gap-1 text-[10px] font-medium text-primary"
				>
					Review bounty details <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</Panel>
			{(bounty.status === "refunded" || bounty.status === "cancelled") && (
				<ButtonLink href="/history" variant="secondary" fullWidth>
					See it in payment history
				</ButtonLink>
			)}
		</>
	);
}
