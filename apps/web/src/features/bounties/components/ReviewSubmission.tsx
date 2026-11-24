"use client";

import { AlertTriangle, BadgeCheck, ExternalLink, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BountyMiniHeader, BountyNotFound, useBountyRoute, type BountyParams } from "@/features/bounties/components/BountyRoute";
import { ReviewAside } from "@/features/bounties/components/ReviewAside";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Field, Textarea } from "@repo/ui/field";
import { Modal } from "@repo/ui/modal";
import { Notice } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { canReview } from "@repo/stellar/escrow";
import { formatUsd } from "@repo/stellar/format";
import { useAppStore } from "@/features/escrow/store";

export function ReviewSubmission({ params }: { params: BountyParams }) {
	const router = useRouter();
	const { id, bounty, address } = useBountyRoute(params);
	const approve = useAppStore((s) => s.approveAndRelease);
	const requestRevision = useAppStore((s) => s.requestRevision);
	const [busy, setBusy] = useState(false);
	const [revisionOpen, setRevisionOpen] = useState(false);
	const [comment, setComment] = useState("");
	const [commentError, setCommentError] = useState<string>();
	if (!bounty) return <BountyNotFound id={id} />;

	const submission = bounty.submissions.at(-1);
	const guard = canReview(bounty, address);
	const detailHref = `/bounties/${bounty.id}`;

	return (
		<>
			<PageHeader
				back={{ href: detailHref, label: "Back to bounty" }}
				eyebrow="Review the work"
				title="A clear review keeps good work moving."
				description="Check the deliverable and notes, then approve the agreed reward or request a revision."
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
				<Panel className="p-5 sm:p-8">
					<BountyMiniHeader bounty={bounty} />

					{!submission ? (
						<Notice tone="neutral" className="mt-8">
							There is no submission yet. You&apos;ll be notified when the contributor submits their work.
						</Notice>
					) : (
						<div className="mt-8 space-y-6">
							<ReadOnly label="Deliverable link" hint="Link to a PR, preview, file, or finished work">
								<a
									href={submission.deliverableUrl}
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-between gap-3 break-all hover:text-primary"
								>
									{submission.deliverableUrl} <ExternalLink className="size-4 shrink-0 text-muted" />
								</a>
							</ReadOnly>
							<ReadOnly label="Submission notes" hint="What changed, and what should the issuer check?" tall>
								{submission.notes}
							</ReadOnly>
							<ReadOnly
								label="Supporting evidence reference"
								hint="Optional link to screenshots, test results, or related evidence"
							>
								{submission.evidence ? (
									<a
										href={submission.evidence}
										target="_blank"
										rel="noreferrer"
										className="flex items-center justify-between gap-3 break-all hover:text-primary"
									>
										{submission.evidence} <ExternalLink className="size-4 shrink-0 text-muted" />
									</a>
								) : (
									<span className="text-muted">None provided</span>
								)}
							</ReadOnly>

							{guard ? (
								<Notice tone="attention" icon={<AlertTriangle />}>
									{guard}{" "}
									<ButtonLink
										href={detailHref}
										variant="ghost"
										size="sm"
										className="h-auto px-0 text-primary hover:bg-transparent"
									>
										View bounty →
									</ButtonLink>
								</Notice>
							) : (
								<div className="grid gap-4 sm:grid-cols-[1.15fr_1fr]">
									<Button
										size="lg"
										icon={<BadgeCheck />}
										loading={busy}
										loadingText="Waiting for your wallet…"
										onClick={async () => {
											setBusy(true);
											const ok = await approve(bounty.id);
											setBusy(false);
											if (ok) router.push(detailHref);
										}}
									>
										Approve and release {formatUsd(bounty.rewardAmount)}
									</Button>
									<Button variant="secondary" size="lg" icon={<Timer />} disabled={busy} onClick={() => setRevisionOpen(true)}>
										Request a revision
									</Button>
								</div>
							)}
							<p className="text-[10px] text-muted">Approval simulates payout only. No real USDC is transferred.</p>
						</div>
					)}
				</Panel>
				<ReviewAside bounty={bounty} />
			</div>

			<Modal open={revisionOpen} onClose={() => setRevisionOpen(false)} label="Request a revision">
				<h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Request a revision</h2>
				<p className="mt-2 text-sm text-muted">The reward stays locked in escrow. Tell the contributor exactly what to change.</p>
				<Field label="What needs to change?" htmlFor="revision" error={commentError} className="mt-6">
					<Textarea
						id="revision"
						rows={4}
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder="e.g. The mobile layout breaks below 375px — please fix the stepper wrapping."
						aria-invalid={!!commentError}
						autoFocus
					/>
				</Field>
				<div className="mt-6 grid grid-cols-2 gap-4">
					<Button variant="secondary" size="lg" onClick={() => setRevisionOpen(false)}>
						Cancel
					</Button>
					<Button
						size="lg"
						loading={busy}
						loadingText="Sending…"
						onClick={async () => {
							if (comment.trim().length < 10) {
								setCommentError("Add a little more detail (at least 10 characters).");
								return;
							}
							setCommentError(undefined);
							setRevisionOpen(false);
							setBusy(true);
							const ok = await requestRevision(bounty.id, comment.trim());
							setBusy(false);
							if (ok) router.push(detailHref);
						}}
					>
						Send request
					</Button>
				</div>
			</Modal>
		</>
	);
}

function ReadOnly({ label, hint, tall, children }: { label: string; hint: string; tall?: boolean; children: React.ReactNode }) {
	return (
		<div className="space-y-2">
			<div>
				<p className="text-xs font-semibold text-ink">{label}</p>
				<p className="mt-0.5 text-[11px] text-muted">{hint}</p>
			</div>
			<div
				className={`rounded-[var(--radius-sm)] border border-line bg-canvas px-4 py-3.5 text-sm leading-relaxed text-ink ${tall ? "min-h-24" : ""}`}
			>
				{children}
			</div>
		</div>
	);
}
