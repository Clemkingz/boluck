"use client";

import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	CircleCheck,
	FileClock,
	Link2,
	Lock,
	Send,
	ShieldCheck,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ActivityFeed } from "@/features/bounties/components/ActivityFeed";
import { BountyHeaderCard, BountyNotFound, useBountyRoute, type BountyParams } from "@/features/bounties/components/BountyRoute";
import { LifecycleStepper } from "@/features/bounties/components/LifecycleStepper";
import { BackLink } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Input } from "@repo/ui/field";
import { CheckList, CopyButton } from "@repo/ui/misc";
import { DetailRows, Panel } from "@repo/ui/panel";
import { Reveal } from "@repo/ui/reveal";
import { txReference } from "@repo/stellar/network";
import { walletName } from "@/features/wallet/wallets";
import { canAssign } from "@repo/stellar/escrow";
import { formatAmount, formatDate, formatDateTime, formatUsd, shortAddress } from "@repo/stellar/format";
import { ADA, ACCOUNT_NAMES } from "@/lib/api/mock-data";
import type { Bounty, Transaction } from "@repo/stellar/bounty";
import { useAppStore } from "@/features/escrow/store";

export function BountyDetail({ params }: { params: BountyParams }) {
	const { id, bounty, isIssuer, isContributor } = useBountyRoute(params);
	const search = useSearchParams();
	const transactions = useAppStore((s) => s.transactions);
	const bounties = useAppStore((s) => s.bounties);
	const address = useAppStore((s) => s.wallet?.address);
	if (!bounty) return <BountyNotFound id={id} />;

	const txs = transactions.filter((t) => t.bountyId === bounty.id);
	const fundTx = txs.find((t) => t.type === "fund" && t.status === "success");
	const showFunding = search.get("confirmed") === "fund" && !!fundTx && bounty.status !== "draft";
	const caption =
		bounty.status === "draft"
			? "Ready to fund"
			: bounty.status === "paid"
				? "Released to contributor"
				: bounty.status === "refunded" || bounty.status === "cancelled"
					? "Escrow closed"
					: "Reward reserved in demo escrow";
	const mine = isIssuer || isContributor;

	return (
		<>
			<BackLink href={mine ? "/overview" : "/bounties"} label={mine ? "Back to Overview" : "Back to bounties"} />
			<div className="space-y-6">
				<BountyHeaderCard bounty={bounty} caption={caption} />

				{!showFunding && bounty.status !== "cancelled" && bounty.status !== "refunded" && (
					<Panel className="px-3 py-6 sm:px-8 sm:py-8">
						<LifecycleStepper status={bounty.status} />
					</Panel>
				)}

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
					{/* On small screens the action panel comes first */}
					<div className="order-2 space-y-6 lg:order-1">
						<Panel className="p-6">
							<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">The Brief</h2>
							<p className="mt-4 text-xs leading-relaxed text-muted">{bounty.description}</p>
							<div className="my-6 h-px bg-line" />
							<h3 className="font-display text-base font-bold tracking-[-0.02em] text-ink">What success looks like</h3>
							<CheckList items={bounty.acceptanceCriteria} className="mt-5" />
						</Panel>
						<Panel className="p-6">
							<h2 className="text-sm font-semibold text-ink">Completion requirements</h2>
							<CheckList items={bounty.requirements} className="mt-5" />
						</Panel>
						<Reveal>
							<WorkAndReview bounty={bounty} isIssuer={isIssuer} />
						</Reveal>
						<Reveal>
							<Panel className="p-6">
								<h2 className="text-sm font-semibold text-ink">Contract activity</h2>
								<p className="mt-1 text-[10px] text-muted">Every escrow event for this bounty, newest first.</p>
								<ActivityFeed transactions={txs} bounties={bounties} me={address} className="mt-6" />
							</Panel>
						</Reveal>
					</div>

					<div className="order-1 space-y-6 lg:order-2">
						{showFunding ? (
							<FundingConfirmed bounty={bounty} tx={fundTx!} />
						) : (
							<NextStep bounty={bounty} isIssuer={isIssuer} isContributor={isContributor} fundTx={fundTx} />
						)}
						<Panel className="p-6">
							<h2 className="flex items-center gap-2 text-base font-semibold text-ink">
								<ShieldCheck className="size-4 text-primary" /> Escrow protection
							</h2>
							<p className="mt-4 text-[10px] leading-relaxed text-muted">
								Funds are represented as escrowed only in this demo. On the live product, the escrow contract would enforce
								funding, assignment, approval, and refund rules.
							</p>
							<Link
								href={`/refunds?bounty=${bounty.id}`}
								className="group mt-4 inline-flex items-center gap-1 text-[10px] font-medium text-primary"
							>
								See cancellation rules <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
							</Link>
						</Panel>
					</div>
				</div>
			</div>
		</>
	);
}

function NextStep({
	bounty: b,
	isIssuer,
	isContributor,
	fundTx,
}: {
	bounty: Bounty;
	isIssuer: boolean;
	isContributor: boolean;
	fundTx?: Transaction;
}) {
	const accept = useAppStore((s) => s.acceptAssignment);
	const claim = useAppStore((s) => s.claimBounty);
	const release = useAppStore((s) => s.releasePayment);
	const [busy, setBusy] = useState(false);
	const href = `/bounties/${b.id}`;

	const run = (fn: () => Promise<boolean>) => async () => {
		setBusy(true);
		await fn();
		setBusy(false);
	};

	let action: ReactNode = null;
	let note = "";

	if (isIssuer) {
		switch (b.status) {
			case "draft":
				action = (
					<ButtonLink href={`${href}/fund`} fullWidth size="lg" icon={<Lock />}>
						Fund {formatUsd(b.rewardAmount)} USDC
					</ButtonLink>
				);
				note = "You will review the amount and confirm on the funding screen.";
				break;
			case "funded":
				action = <AssignForm bounty={b} />;
				note = "Or leave it open — any eligible contributor can claim it.";
				break;
			case "assigned":
				action = <Waiting icon={<FileClock />}>Waiting for acceptance</Waiting>;
				note = "The contributor can see the reward is locked before they accept.";
				break;
			case "in_progress":
				action = <Waiting icon={<FileClock />}>Work in progress</Waiting>;
				note = "You'll be notified as soon as work is submitted.";
				break;
			case "revision_requested":
				action = <Waiting icon={<FileClock />}>Revision in progress</Waiting>;
				note = "The contributor is updating their submission.";
				break;
			case "submitted":
				action = (
					<ButtonLink href={`${href}/review`} fullWidth size="lg" icon={<BadgeCheck />}>
						Review submission
					</ButtonLink>
				);
				note = "Approve to release the reward, or request a revision.";
				break;
			case "approved":
				action = (
					<Button fullWidth size="lg" icon={<Send />} loading={busy} loadingText="Releasing…" onClick={run(() => release(b.id))}>
						Release {formatUsd(b.rewardAmount)} USDC
					</Button>
				);
				note = "Approved — release the escrowed reward to the contributor.";
				break;
			case "paid":
				action = <Released />;
				break;
			default:
				action = (
					<ButtonLink href={`/refunds?bounty=${b.id}`} variant="secondary" fullWidth size="lg">
						View refund details
					</ButtonLink>
				);
		}
	} else if (isContributor) {
		switch (b.status) {
			case "assigned":
				action = (
					<Button
						fullWidth
						size="lg"
						icon={<CircleCheck />}
						loading={busy}
						loadingText="Accepting…"
						onClick={run(() => accept(b.id))}
					>
						Accept Assignment
					</Button>
				);
				note = `${formatAmount(b.escrowBalance)} is already locked for you in escrow.`;
				break;
			case "in_progress":
			case "revision_requested":
				action = (
					<ButtonLink href={`${href}/submit`} fullWidth size="lg" icon={<Send />}>
						{b.status === "revision_requested" ? "Submit a revision" : "Submit completed work"}
					</ButtonLink>
				);
				note = "Share a link the issuer can review.";
				break;
			case "submitted":
			case "approved":
				action = <Waiting icon={<FileClock />}>Awaiting issuer review</Waiting>;
				note = "The reward stays locked while your work is reviewed.";
				break;
			case "paid":
				action = <Released />;
				break;
			default:
				action = <Waiting icon={<ShieldCheck />}>Bounty closed</Waiting>;
		}
	} else if (b.status === "funded" && !b.contributor) {
		action = (
			<Button fullWidth size="lg" icon={<CircleCheck />} loading={busy} loadingText="Accepting…" onClick={run(() => claim(b.id))}>
				Accept this bounty
			</Button>
		);
		note = "The reward is verified in escrow. Accepting assigns it to your wallet.";
	} else {
		action = <Waiting icon={<UserCheck />}>View only</Waiting>;
		note = "Switch to the issuer or assigned contributor wallet to take action.";
	}

	return (
		<Panel className="p-6">
			<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">Next step</h2>
			<p className="mt-1 text-[10px] text-muted">Continue this bounty&apos;s journey.</p>
			<div className="mt-6">{action}</div>
			{note && <p className="mt-3 text-[10px] text-muted">{note}</p>}
			<div className="mt-6 h-px bg-line" />
			<DetailRows
				className="mt-2"
				rows={[
					{ label: "Reward", value: `${formatUsd(b.rewardAmount)} USDC` },
					{ label: "Deadline", value: formatDate(b.deadline) },
					{
						label: "Assigned to",
						value: b.contributor ? <span title={ACCOUNT_NAMES[b.contributor]}>{shortAddress(b.contributor)}</span> : "Open",
					},
					...(fundTx
						? [{ label: "Funding reference", value: <span className="font-mono text-xs">{`DEMO-FUND-${b.id}`}</span> }]
						: []),
				]}
			/>
		</Panel>
	);
}

function Waiting({ icon, children }: { icon: ReactNode; children: ReactNode }) {
	return (
		<div className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-line bg-canvas/50 text-sm text-muted [&_svg]:size-4">
			{icon}
			{children}
		</div>
	);
}

function Released() {
	return (
		<div className="flex h-11 animate-pop-in items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-primary bg-deep/40 text-[15px] text-primary">
			<CircleCheck className="size-5" /> Reward released
		</div>
	);
}

function AssignForm({ bounty }: { bounty: Bounty }) {
	const assign = useAppStore((s) => s.assignContributor);
	const caller = useAppStore((s) => s.wallet?.address);
	const [value, setValue] = useState("");
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);
	return (
		<form
			noValidate
			className="space-y-3"
			onSubmit={async (e) => {
				e.preventDefault();
				const reason = canAssign(bounty, caller, value.trim());
				setError(reason ?? undefined);
				if (reason) return;
				setBusy(true);
				await assign(bounty.id, value.trim());
				setBusy(false);
			}}
		>
			<label htmlFor="assign" className="text-xs font-semibold text-ink">
				Assign a contributor
			</label>
			<Input
				id="assign"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="G… contributor wallet"
				className="h-11 font-mono text-xs"
				spellCheck={false}
				aria-invalid={!!error}
			/>
			{error && <p className="animate-fade-in text-xs text-attention">{error}</p>}
			<Button type="submit" fullWidth size="lg" icon={<UserCheck />} loading={busy} loadingText="Assigning…">
				Assign contributor
			</Button>
			<button type="button" onClick={() => setValue(ADA)} className="w-full text-center text-[10px] text-primary hover:underline">
				Demo: use {ACCOUNT_NAMES[ADA]}&apos;s wallet
			</button>
		</form>
	);
}

function FundingConfirmed({ bounty, tx }: { bounty: Bounty; tx: Transaction }) {
	const router = useRouter();
	const provider = useAppStore((s) => s.wallet?.provider);
	return (
		<Panel className="animate-pop-in p-6">
			<div className="flex flex-col items-center text-center">
				<span className="grid size-14 place-items-center rounded-full bg-primary text-on-primary">
					<svg viewBox="0 0 24 24" className="size-7" fill="none" aria-hidden>
						<path
							d="M5 12.5l4.5 4.5L19 7.5"
							stroke="currentColor"
							strokeWidth="2.6"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeDasharray="24"
							className="animate-draw"
						/>
					</svg>
				</span>
				<h2 className="mt-5 text-base font-semibold text-ink">Funding confirmed</h2>
				<p className="mt-1 text-sm text-muted">
					<span className="font-semibold text-primary">{formatAmount(bounty.rewardAmount)}</span> is now locked in escrow.
				</p>
			</div>
			<p className="mt-6 text-xs font-semibold text-ink">Transaction hash</p>
			<div className="mt-2 flex items-start gap-2 rounded-[var(--radius-sm)] border border-line bg-canvas/60 p-3">
				<p className="min-w-0 flex-1 font-mono text-xs break-all text-primary">{tx.hash}</p>
				<CopyButton value={tx.hash} label="Copy transaction hash" />
			</div>
			<DetailRows
				className="mt-3 border-t border-line pt-2"
				rows={[
					{ label: "Ledger", value: `#${tx.ledger.toLocaleString("en-US")}` },
					{ label: "Deadline", value: formatDate(bounty.deadline) },
					{ label: "Assigned to", value: bounty.contributor ? shortAddress(bounty.contributor) : "Open" },
					{ label: "Funded from", value: `${walletName(provider)} · ${shortAddress(tx.from)}` },
					{ label: "Confirmed", value: formatDateTime(tx.timestamp) },
					{ label: "Reference", value: <span className="font-mono text-[10px]">{txReference(tx)}</span> },
				]}
			/>
			<div className="mt-4 grid gap-3">
				<ButtonLink href="/overview" fullWidth size="lg" icon={<ArrowLeft />}>
					Back to Dashboard
				</ButtonLink>
				<Button variant="ghost" size="sm" onClick={() => router.replace(`/bounties/${bounty.id}`, { scroll: false })}>
					View bounty progress
				</Button>
			</div>
			<p className="mt-4 border-t border-line pt-4 text-center text-[10px] leading-relaxed text-muted">
				The contributor can now see the reward is funded before accepting the work. Explorer links will appear here once the
				contract is live.
			</p>
		</Panel>
	);
}

function WorkAndReview({ bounty: b, isIssuer }: { bounty: Bounty; isIssuer: boolean }) {
	const latest = b.submissions.at(-1);
	let body: ReactNode;

	if (b.status === "paid") {
		body = <Dashed>Approved and paid. The work and transaction reference are in payment history.</Dashed>;
	} else if (latest && (b.status === "submitted" || b.status === "revision_requested" || b.status === "approved")) {
		const revision = latest.review?.decision === "revision_requested";
		body = (
			<div className="animate-fade-up rounded-[var(--radius-md)] border border-line bg-canvas/60 p-5 sm:p-6">
				<p className="flex items-center gap-2 text-sm font-semibold text-ink">
					<FileClock className={revision ? "size-4 text-attention" : "size-4 text-review"} />
					{revision ? "Revision requested" : "Submission ready for review"}
				</p>
				<a
					href={latest.deliverableUrl}
					target="_blank"
					rel="noreferrer"
					className="mt-4 flex items-center gap-2 text-[10px] break-all text-primary hover:underline"
				>
					<Link2 className="size-4 shrink-0" /> {latest.deliverableUrl}
				</a>
				<p className="mt-4 text-[10px] leading-relaxed text-ink">{latest.notes}</p>
				{latest.evidence && <p className="mt-3 text-[10px] break-all text-muted">Evidence · {latest.evidence}</p>}
				{revision && latest.review?.comment && (
					<p className="mt-4 rounded-[var(--radius-sm)] border border-attention/40 bg-attention/10 p-3 text-[11px] text-ink">
						<span className="font-semibold">Issuer feedback:</span> {latest.review.comment}
					</p>
				)}
				<p className="mt-3 text-[10px] text-muted">Submitted {formatDateTime(latest.submittedAt)}</p>
				{isIssuer && b.status === "submitted" && (
					<ButtonLink href={`/bounties/${b.id}/review`} className="mt-5" icon={<BadgeCheck />}>
						Approve or request revision
					</ButtonLink>
				)}
			</div>
		);
	} else {
		body = <Dashed>Work submissions appear here once the assignment is accepted.</Dashed>;
	}

	return (
		<Panel className="p-6">
			<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">Work &amp; review</h2>
			<p className="mt-1 text-[10px] text-muted">Review every submission before releasing funds.</p>
			<div className="mt-6">{body}</div>
		</Panel>
	);
}

function Dashed({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-[var(--radius-md)] border border-dashed border-line px-4 py-6 text-center text-[10px] text-muted">
			{children}
		</div>
	);
}
