"use client";

import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	CircleCheck,
	ExternalLink,
	FileClock,
	Hourglass,
	PenLine,
	Link2,
	Lock,
	Send,
	ShieldCheck,
	Trash2,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityFeed } from "@/features/bounties/components/ActivityFeed";
import { BountyHeaderCard, BountyNotFound, useBountyRoute, type BountyParams } from "@/features/bounties/components/BountyRoute";
import { LifecycleStepper } from "@/features/bounties/components/LifecycleStepper";
import { BackLink } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Input } from "@repo/ui/field";
import { CheckList, CopyButton } from "@repo/ui/misc";
import { DetailRows, Panel } from "@repo/ui/panel";
import { Reveal } from "@repo/ui/reveal";
import { explorerTxUrl, txReference } from "@repo/stellar/network";
import { walletName } from "@/features/wallet/wallets";
import { canAssign } from "@repo/stellar/escrow";
import { formatAmount, formatDate, formatDateTime, formatUsd, shortAddress } from "@repo/stellar/format";
import { ADA, ACCOUNT_NAMES } from "@/lib/api/mock-data";
import type { Bounty, Transaction } from "@repo/stellar/bounty";
import { useAppStore } from "@/features/escrow/store";
import { LIVE } from "@/lib/api/config";

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
			? bounty.chain
				? bounty.chain.onChain
					? "Published · awaiting funding"
					: "Draft · editable"
				: "Ready to fund"
			: bounty.status === "paid"
				? "Released to contributor"
				: bounty.status === "refunded" || bounty.status === "cancelled"
					? "Escrow closed"
					: LIVE
						? bounty.chain?.fundingVerified
							? "Reward verified in escrow"
							: "Not funded yet"
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
								<h2 className="text-sm font-semibold text-ink">Escrow activity</h2>
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
								{LIVE
									? "The reward sits in a Stellar claimable balance. Boluck's escrow rules decide who can claim it: the contributor once the work is approved, or the issuer under the cancellation rules."
									: "Funds are represented as escrowed only in this demo. On Stellar, the escrow rules enforce funding, assignment, approval, and refund."}
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
	const release = useAppStore((s) => s.releasePayment);
	const claimPayment = useAppStore((s) => s.claimPayment);
	const address = useAppStore((s) => s.wallet?.address);
	const [busy, setBusy] = useState(false);
	const can = (k: string) => !!b.chain?.availableActions.includes(k as never);
	/** Live: a button only appears when the server lists one of its actions (guide §1.6). Demo: always. */
	const allowed = (...kinds: string[]) => !b.chain || kinds.some(can);
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
				action = !allowed("create", "fund") ? (
					<Waiting icon={<FileClock />}>Not ready to fund</Waiting>
				) : (
					<ButtonLink href={`${href}/fund`} fullWidth size="lg" icon={<Lock />}>
						{can("create") ? "Publish and fund" : "Fund"} {formatUsd(b.rewardAmount)} USDC
					</ButtonLink>
				);
				note = b.chain?.onChain
					? "Published on Stellar. Fund it to lock the reward in escrow."
					: "You will review the amount and confirm on the funding screen.";
				if (!b.chain || !b.chain.onChain)
					action = (
						<div className="space-y-3">
							{action}
							<DraftTools bounty={b} />
						</div>
					);
				break;
			case "funded":
				action = allowed("assign") ? <AssignForm bounty={b} /> : <Waiting icon={<FileClock />}>Funding confirmed</Waiting>;
				note = "The contributor can see the reward is locked before they accept.";
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
				action = allowed("approve", "request_revision") ? (
					<ButtonLink href={`${href}/review`} fullWidth size="lg" icon={<BadgeCheck />}>
						Review submission
					</ButtonLink>
				) : (
					<Waiting icon={<FileClock />}>Review window closed</Waiting>
				);
				note = "Approve to release the reward, or request a revision.";
				break;
			case "approved":
				action = !allowed("release") ? (
					<Waiting icon={<FileClock />}>Releasing automatically</Waiting>
				) : (
					<Button fullWidth size="lg" icon={<Send />} loading={busy} loadingText="Releasing…" onClick={run(() => release(b.id))}>
						Release {formatUsd(b.rewardAmount)} USDC
					</Button>
				);
				note = "Approved — release the escrowed reward to the contributor.";
				break;
			case "paid":
				action = <Released automatically={b.chain?.paidAutomatically} />;
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
				action = !allowed("accept") ? (
					<Waiting icon={<FileClock />}>Not available right now</Waiting>
				) : (
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
				action = !allowed("submit") ? (
					<Waiting icon={<FileClock />}>Submission window closed</Waiting>
				) : (
					<ButtonLink href={`${href}/submit`} fullWidth size="lg" icon={<Send />}>
						{b.status === "revision_requested" ? "Submit a revision" : "Submit completed work"}
					</ButtonLink>
				);
				note = "Share a link the issuer can review.";
				break;
			case "approved":
			case "submitted":
				// Fallback for the server's automatic release, only when the server offers it.
				if (can("auto_release")) {
					action = (
						<Button
							fullWidth
							size="lg"
							icon={<CircleCheck />}
							loading={busy}
							loadingText="Waiting for your wallet…"
							onClick={run(() => claimPayment(b.id))}
						>
							Claim payment · {formatUsd(b.rewardAmount)} USDC
						</Button>
					);
					note = "The reward can be released to you now.";
					break;
				}
				if (b.status === "approved") {
					action = <Waiting icon={<FileClock />}>Approved · awaiting release</Waiting>;
					note = "The issuer releases the reward next.";
					break;
				}
				action = <Waiting icon={<FileClock />}>Awaiting issuer review</Waiting>;
				note = "The reward stays locked while your work is reviewed.";
				break;
			case "paid":
				action = <Released automatically={b.chain?.paidAutomatically} />;
				break;
			default:
				action = <Waiting icon={<ShieldCheck />}>Bounty closed</Waiting>;
		}
	} else {
		action = <Waiting icon={<UserCheck />}>View only</Waiting>;
		note = "Switch to the issuer or assigned contributor wallet to take action.";
	}

	return (
		<Panel className="p-6">
			<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">Next step</h2>
			<p className="mt-1 text-[10px] text-muted">Continue this bounty&apos;s journey.</p>
			{b.chain?.cancelRequestedBy && <CancelRequestBanner bounty={b} mine={b.chain.cancelRequestedBy === address} />}
			<div className="mt-6">{action}</div>
			<AutoRelease bounty={b} />
			{note && <p className="mt-3 text-[10px] text-muted">{note}</p>}
			<div className="mt-6 h-px bg-line" />
			<DetailRows
				className="mt-2"
				rows={[
					{ label: "Reward", value: `${formatUsd(b.rewardAmount)} USDC` },
					{ label: "Deadline", value: formatDate(b.deadline) },
					{
						// A contributor named on a draft is only assigned (on Stellar) after funding.
						label: b.chain && b.contributor && (b.status === "draft" || b.status === "funded") ? "To be assigned" : "Assigned to",
						value: b.contributor ? <span title={ACCOUNT_NAMES[b.contributor]}>{shortAddress(b.contributor)}</span> : "Not yet",
					},
					...(b.chain
						? [
								{
									label: "Funding",
									value: b.chain.fundingVerified ? (
										<span className="inline-flex items-center gap-1 text-primary">
											<ShieldCheck className="size-3.5" /> Verified on Stellar
										</span>
									) : (
										<span className="text-muted">Not funded yet</span>
									),
								},
							]
						: []),
					...(b.chain?.fundTxHash && !fundTx
						? [
								{
									label: "Funding reference",
									value: (
										<a
											href={explorerTxUrl(b.chain.fundTxHash)}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
										>
											{b.chain.fundTxHash.slice(0, 10)}… <ExternalLink className="size-3" />
										</a>
									),
								},
							]
						: []),
					...(fundTx
						? [
								{
									label: "Funding reference",
									value: fundTx.explorerUrl ? (
										<a
											href={fundTx.explorerUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
										>
											{fundTx.hash.slice(0, 10)}… <ExternalLink className="size-3" />
										</a>
									) : (
										<span className="font-mono text-xs">{`DEMO-FUND-${b.id}`}</span>
									),
								},
							]
						: []),
				]}
			/>
		</Panel>
	);
}

/**
 * Deadlines the server enforces on its own (guide §6): the review window after a submission (the reward then releases
 * to the contributor automatically), and the revision window after a revision request.
 */
function AutoRelease({ bounty: b }: { bounty: Bounty }) {
	const enabled = useAppStore((s) => s.escrowConfig?.autoReleaseEnabled);
	const address = useAppStore((s) => s.wallet?.address);
	const now = useNow();
	if (!b.chain) return null;
	const issuer = b.issuer === address;
	const contributor = b.contributor === address;

	if (b.chain.autoReleaseError && contributor)
		return (
			<p
				className="mt-3 rounded-[var(--radius-sm)] border border-attention/50 bg-attention/10 p-3 text-[10px] leading-relaxed text-ink"
				role="alert"
			>
				Your automatic payment did not go through. Check that USDC is enabled in your wallet.
			</p>
		);

	if (b.status === "submitted" && b.chain.reviewDueAt && enabled) {
		const left = new Date(b.chain.reviewDueAt).getTime() - now;
		return (
			<p
				className={`mt-3 flex items-start gap-2 text-[10px] leading-relaxed ${issuer ? "font-semibold text-review" : "text-muted"}`}
			>
				<Hourglass className="mt-px size-3.5 shrink-0" />
				{issuer
					? `Review by ${formatDateTime(b.chain.reviewDueAt)} or the reward releases automatically${left > 0 ? ` (${countdown(left)} left)` : ""}.`
					: left > 0
						? `If the issuer doesn't review within ${countdown(left)}, the reward releases to you automatically.`
						: "The review window has ended; the reward is being released to you."}
			</p>
		);
	}
	if (b.status === "approved" && b.chain.reviewDueAt && enabled) {
		const left = new Date(b.chain.reviewDueAt).getTime() - now;
		return (
			<p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted">
				<Hourglass className="mt-px size-3.5 shrink-0" />
				{left > 0
					? `Releases automatically in ${countdown(left)} if not released sooner.`
					: "Releasing automatically within a few minutes."}
			</p>
		);
	}
	if (b.status === "revision_requested" && b.chain.revisionDueAt) {
		const left = new Date(b.chain.revisionDueAt).getTime() - now;
		return (
			<p
				className={`mt-3 flex items-start gap-2 text-[10px] leading-relaxed ${contributor ? "font-semibold text-review" : "text-muted"}`}
			>
				<Hourglass className="mt-px size-3.5 shrink-0" />
				{left > 0
					? `${contributor ? "Resubmit" : "The contributor can resubmit"} within ${countdown(left)} (by ${formatDateTime(b.chain.revisionDueAt)}).`
					: "The revision window has ended."}
			</p>
		);
	}
	return null;
}

/** Off-chain drafts: edit or delete before publishing. No signature, nothing on Stellar yet. */
function DraftTools({ bounty }: { bounty: Bounty }) {
	const router = useRouter();
	const deleteDraft = useAppStore((s) => s.deleteDraft);
	const [confirming, setConfirming] = useState(false);
	const [busy, setBusy] = useState(false);
	return confirming ? (
		<div className="grid grid-cols-2 gap-3">
			<Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
				Keep it
			</Button>
			<Button
				variant="danger"
				loading={busy}
				loadingText="Deleting…"
				onClick={async () => {
					setBusy(true);
					const ok = await deleteDraft(bounty.id);
					setBusy(false);
					if (ok) router.push("/overview");
				}}
			>
				Delete draft
			</Button>
		</div>
	) : (
		<div className="grid grid-cols-2 gap-3">
			<ButtonLink href={`/bounties/${bounty.id}/edit`} variant="secondary" icon={<PenLine />}>
				Edit
			</ButtonLink>
			<Button variant="ghost" icon={<Trash2 />} onClick={() => setConfirming(true)}>
				Delete
			</Button>
		</div>
	);
}

function countdown(ms: number) {
	const mins = Math.floor(ms / 60_000);
	const d = Math.floor(mins / 1440);
	const h = Math.floor((mins % 1440) / 60);
	const m = mins % 60;
	return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${Math.max(m, 1)}m`;
}

/** Current time, refreshed every 30 s (kept out of render for purity). */
function useNow() {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const t = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(t);
	}, []);
	return now;
}

/** Assigned bounties end only by agreement: one party asks, the other confirms (or the asker withdraws). */
function CancelRequestBanner({ bounty: b, mine }: { bounty: Bounty; mine: boolean }) {
	const withdraw = useAppStore((s) => s.withdrawCancel);
	const confirm = useAppStore((s) => s.confirmCancel);
	const [busy, setBusy] = useState(false);
	const go = (fn: () => Promise<boolean>) => async () => {
		setBusy(true);
		await fn();
		setBusy(false);
	};
	return (
		<div className="mt-5 animate-pop-in rounded-[var(--radius-md)] border border-review/60 bg-review/10 p-4" role="status">
			<p className="flex items-center gap-2 text-xs font-semibold text-ink">
				<Hourglass className="size-4 text-review" />
				{mine ? "You asked to cancel this bounty" : `${shortAddress(b.chain?.cancelRequestedBy)} asked to cancel this bounty`}
			</p>
			<p className="mt-1.5 text-[10px] leading-relaxed text-muted">
				{mine
					? "Nothing moves until the other party confirms. You can withdraw the request."
					: `If you agree, ${formatAmount(b.escrowBalance)} returns to the issuer and the bounty closes.`}
			</p>
			<Button
				className="mt-3"
				size="sm"
				variant={mine ? "secondary" : "primary"}
				loading={busy}
				loadingText="Waiting for your wallet…"
				onClick={go(() => (mine ? withdraw(b.id) : confirm(b.id)))}
			>
				{mine ? "Withdraw request" : "Agree and cancel"}
			</Button>
		</div>
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

function Released({ automatically }: { automatically?: boolean }) {
	return (
		<div className="flex h-11 animate-pop-in items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-primary bg-deep/40 text-[15px] text-primary">
			<CircleCheck className="size-5" /> {automatically ? "Released automatically" : "Reward released"}
		</div>
	);
}

function AssignForm({ bounty }: { bounty: Bounty }) {
	const assign = useAppStore((s) => s.assignContributor);
	const caller = useAppStore((s) => s.wallet?.address);
	// Live: the contributor named when the bounty was created, if any.
	const [value, setValue] = useState(bounty.contributor ?? "");
	const [error, setError] = useState<string>();
	const [busy, setBusy] = useState(false);
	return (
		<form
			noValidate
			className="space-y-3"
			onSubmit={async (e) => {
				e.preventDefault();
				const reason = canAssign({ ...bounty, contributor: undefined }, caller, value.trim());
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
			{!LIVE && (
				<button
					type="button"
					onClick={() => setValue(ADA)}
					className="w-full text-center text-[10px] text-primary hover:underline"
				>
					Demo: use {ACCOUNT_NAMES[ADA]}&apos;s wallet
				</button>
			)}
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
					...(tx.ledger ? [{ label: "Ledger", value: `#${tx.ledger.toLocaleString("en-US")}` }] : []),
					{ label: "Deadline", value: formatDate(bounty.deadline) },
					{ label: "Assigned to", value: bounty.contributor ? shortAddress(bounty.contributor) : "Open" },
					{ label: "Funded from", value: `${walletName(provider)} · ${shortAddress(tx.from)}` },
					{ label: "Confirmed", value: formatDateTime(tx.timestamp) },
					tx.explorerUrl
						? {
								label: "Explorer",
								value: (
									<a
										href={tx.explorerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-primary hover:underline"
									>
										stellar.expert <ExternalLink className="size-3" />
									</a>
								),
							}
						: { label: "Reference", value: <span className="font-mono text-[10px]">{txReference(tx)}</span> },
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
				{LIVE
					? "The contributor can now see the reward is funded before accepting the work."
					: "The contributor can now see the reward is funded before accepting the work. In live mode every step links to stellar.expert."}
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
					rel="noopener noreferrer"
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
