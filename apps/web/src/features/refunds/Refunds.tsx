"use client";

import { ArrowDownLeft, ArrowRight, CircleCheck, Fingerprint, Lock, ShieldCheck, Wallet } from "lucide-react";
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
import { formatUsd } from "@repo/stellar/format";
import type { Bounty } from "@repo/stellar/bounty";
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
	const selectedId = search.get("bounty") ?? bounties.find((b) => cancellationPath(b).allowed)?.id ?? bounties[0]?.id;
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
					{selected && <Eligibility key={selected.id} bounty={selected} isIssuer={selected.issuer === address} />}
				</div>
			</div>
		</>
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
				<h2 className="text-sm font-semibold text-ink">What the contract enforces</h2>
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
