"use client";

import { AlertTriangle, ArrowLeft, Link2, RotateCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { shortHash } from "@repo/stellar/format";
import { Button } from "@repo/ui/button";
import { DetailRows } from "@repo/ui/panel";
import { toast } from "@repo/ui/toast";
import { ApiError } from "@/lib/api/client";
import { admin, type AdminBountyDetail } from "@/lib/api/admin";
import { APP_URL } from "@/lib/site";
import { TxRows } from "@/features/transactions/TxList";
import {
	Addr,
	Amount,
	ErrorNote,
	Explorer,
	humanize,
	Loading,
	PageHeader,
	Section,
	StatusBadge,
	useApi,
	when,
} from "@/components/ui";

const TIMELINE: [string, string][] = [
	["createdAt", "Draft saved"],
	["onChainAt", "Published"],
	["fundedAt", "Funded"],
	["assignedAt", "Assigned"],
	["acceptedAt", "Accepted"],
	["submittedAt", "Submitted"],
	["approvedAt", "Approved"],
	["paidAt", "Paid"],
	["cancelledAt", "Cancelled"],
	["refundedAt", "Refunded"],
];

function RetryAutoRelease({ bounty, onDone }: { bounty: AdminBountyDetail; onDone: () => void }) {
	const [busy, setBusy] = useState(false);
	const applicable = bounty.status === "submitted" || bounty.status === "approved";
	if (!applicable) return null;
	return (
		<div className="rounded-[var(--radius-md)] border border-line bg-canvas/50 p-4">
			<p className="text-sm font-semibold text-ink">Automatic release</p>
			<p className="mt-1 text-xs text-muted">
				{bounty.autoReleaseError ? (
					<span className="text-attention">Last attempt failed: {bounty.autoReleaseError}</span>
				) : bounty.reviewDueAt ? (
					<>Due {when(bounty.reviewDueAt)}.</>
				) : (
					"Not scheduled."
				)}
				{bounty.autoReleaseAttemptAt && <> Last attempt {when(bounty.autoReleaseAttemptAt)}.</>}
			</p>
			<Button
				className="mt-3"
				size="sm"
				variant={bounty.autoReleaseError ? "primary" : "secondary"}
				icon={<RotateCw />}
				loading={busy}
				loadingText="Queuing…"
				onClick={async () => {
					setBusy(true);
					try {
						await admin.retryAutoRelease(bounty.reference);
						toast.success("Auto-release queued", {
							description: "The worker retries on its next pass, after checking every rule.",
						});
						onDone();
					} catch (e) {
						toast.error("Couldn't queue the retry", { description: e instanceof ApiError ? e.message : "Try again." });
					} finally {
						setBusy(false);
					}
				}}
			>
				Retry auto-release
			</Button>
			<p className="mt-2 text-[10px] text-muted">Clears the back-off only. It can&apos;t pay a bounty that isn&apos;t due.</p>
		</div>
	);
}

const lines = (t: string | null | undefined) =>
	(t ?? "")
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);

export function BountyDetail() {
	const { reference } = useParams<{ reference: string }>();
	const ref = decodeURIComponent(reference).toUpperCase();
	const { data: b, error, loading, reload } = useApi(() => admin.bounty(ref), ref);

	return (
		<>
			<Link href="/bounties" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
				<ArrowLeft className="size-4" /> All bounties
			</Link>
			{error && <ErrorNote message={error} onRetry={reload} />}
			{loading && !b && <Loading rows={6} />}
			{b && (
				<>
					<PageHeader
						title={b.title || "Untitled draft"}
						description={`${b.reference} · ${b.onChain ? "on Stellar" : "off-chain draft"} · version ${b.version}`}
						actions={
							<a href={`${APP_URL}/bounties/${b.reference}`} className="text-xs text-primary hover:underline">
								Open in the app (parties only) →
							</a>
						}
					/>
					{(b.autoReleaseError || b.cancelRequestedBy || b.pastRecovery) && (
						<div className="mb-6 space-y-2">
							{b.autoReleaseError && <Alert>Auto-release failed: {b.autoReleaseError}</Alert>}
							{b.cancelRequestedBy && (
								<Alert>
									Cancellation requested by <Addr address={b.cancelRequestedBy} />; waiting on the other party.
								</Alert>
							)}
							{b.pastRecovery && <Alert>Past the recovery date: only the issuer can reclaim the escrow.</Alert>}
						</div>
					)}

					<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
						<div className="space-y-6">
							<Section title="Record">
								<DetailRows
									rows={[
										{ label: "Status", value: <StatusBadge status={b.status} /> },
										{ label: "Reward", value: <Amount value={b.reward} asset={b.asset} /> },
										{ label: "Issuer", value: <Addr address={b.issuerAddress} /> },
										{ label: "Contributor", value: <Addr address={b.contributorAddress} /> },
										{ label: "Deadline", value: when(b.deadline) },
										{ label: "Funding", value: b.fundingVerified ? "Verified on Stellar" : "Not funded" },
										{
											label: "Funding transaction",
											value: b.fundTx ? <Explorer href={b.fundTx.explorerUrl} label={shortHash(b.fundTx.hash)} /> : "—",
										},
										{
											label: "Claimable balance",
											value: b.balanceId ? (
												<span className="font-mono text-xs break-all">{shortHash(b.balanceId, 10)}</span>
											) : (
												"—"
											),
										},
										{ label: "Revisions", value: b.revisionCount },
										{ label: "Review due", value: when(b.reviewDueAt) },
										{ label: "Revision due", value: when(b.revisionDueAt) },
										{ label: "Issuer can reclaim", value: when(b.reclaimAfterAt) },
										{ label: "Recovery date", value: when(b.recoveryAt) },
										{ label: "Paid automatically", value: b.paidAutomatically ? "Yes" : "No" },
									]}
								/>
							</Section>
							<Section title="Brief">
								<p className="text-sm leading-relaxed whitespace-pre-line text-ink">{b.description || "—"}</p>
								{[
									["Requirements", b.requirements],
									["Acceptance criteria", b.acceptanceCriteria],
								].map(([title, text]) => (
									<div key={title} className="mt-4">
										<p className="text-xs font-semibold text-muted">{title}</p>
										<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink">
											{lines(text).map((l) => (
												<li key={l} className="break-words">
													{l}
												</li>
											))}
										</ul>
									</div>
								))}
							</Section>
							<Section title={`Submissions (${b.submissions.length})`}>
								{b.submissions.length === 0 ? (
									<p className="text-xs text-muted">No work submitted.</p>
								) : (
									<ul className="space-y-3">
										{b.submissions.map((s) => (
											<li key={s.id} className="rounded-[var(--radius-md)] border border-line bg-canvas/50 p-4 text-sm">
												<div className="flex flex-wrap items-center justify-between gap-2">
													<span className="font-semibold text-ink">Round {s.round}</span>
													<span className="text-xs text-muted">{when(s.submittedAt)}</span>
												</div>
												<a
													href={s.deliverableUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="mt-2 flex items-center gap-1.5 text-xs break-all text-primary hover:underline"
												>
													<Link2 className="size-3.5 shrink-0" /> {s.deliverableUrl}
												</a>
												{s.notes && <p className="mt-2 text-xs whitespace-pre-line text-ink">{s.notes}</p>}
												{s.evidenceReference && (
													<p className="mt-1 text-xs break-all text-muted">Evidence · {s.evidenceReference}</p>
												)}
												{s.revisionNote && (
													<p className="mt-2 rounded-[var(--radius-sm)] border border-attention/40 bg-attention/10 p-2 text-xs text-ink">
														Revision requested: {s.revisionNote}
													</p>
												)}
												{s.tx && (
													<div className="mt-2">
														<Explorer href={s.tx.explorerUrl} label={`Recorded · ${shortHash(s.tx.hash)}`} />
													</div>
												)}
											</li>
										))}
									</ul>
								)}
							</Section>
						</div>

						<div className="space-y-6">
							<RetryAutoRelease bounty={b} onDone={reload} />
							<Section title="Timeline">
								<ol className="space-y-2 text-xs">
									{TIMELINE.filter(([k]) => b.timeline[k]).map(([k, label]) => (
										<li key={k} className="flex justify-between gap-3">
											<span className="text-ink">{label}</span>
											<span className="text-muted">{when(b.timeline[k])}</span>
										</li>
									))}
								</ol>
							</Section>
							<Section title="Verified activity">
								<ol className="space-y-3 text-xs">
									{b.activity.map((a) => (
										<li key={a.id} className="flex flex-col gap-0.5">
											<span className="text-ink">
												{humanize(a.kind)}
												{a.amount && (
													<>
														{" · "}
														<Amount value={a.amount} asset={b.asset} />
													</>
												)}
											</span>
											<span className="flex flex-wrap items-center gap-x-2 text-muted">
												{when(a.at)} {a.actor && <Addr address={a.actor} />} {a.tx && <Explorer href={a.tx.explorerUrl} />}
											</span>
										</li>
									))}
									{b.activity.length === 0 && <li className="text-muted">Nothing on chain yet.</li>}
								</ol>
							</Section>
						</div>
					</div>

					<Section title={`Transactions (${b.transactions.length})`} className="mt-6" flush>
						<TxRows items={b.transactions} onChange={reload} showBounty={false} />
					</Section>
				</>
			)}
		</>
	);
}

function Alert({ children }: { children: React.ReactNode }) {
	return (
		<p
			className="flex items-start gap-2 rounded-[var(--radius-md)] border border-attention/60 bg-attention/10 p-3 text-sm text-ink"
			role="alert"
		>
			<AlertTriangle className="mt-0.5 size-4 shrink-0 text-attention" />
			<span className="min-w-0 break-words">{children}</span>
		</p>
	);
}
