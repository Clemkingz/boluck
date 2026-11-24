/** Maps API responses onto the app's domain model (`@repo/stellar/bounty`), so screens work the same in both modes. */
import type { Balance, Bounty, BountyIcon, Submission, Transaction, TxType } from "@repo/stellar/bounty";
import type { AccountSummaryDto, ActivityDto, BountyDto, SubmissionDto } from "./types";

/** The API has no per-bounty icon; every live bounty uses the escrow shield. */
const ICON: BountyIcon = "shield";

/** The API stores requirements and acceptance criteria as one text block; the UI shows one item per line. */
export const splitLines = (text: string | null | undefined) =>
	(text ?? "")
		.split("\n")
		.map((l) => l.replace(/^[-*•]\s*/, "").trim())
		.filter(Boolean);

const HELD = new Set(["funded", "assigned", "in_progress", "submitted", "revision_requested", "approved"]);

export function toBounty(dto: BountyDto, submissions: Submission[] = []): Bounty {
	const reward = Number(dto.reward);
	const times = Object.values(dto.timeline).filter((t): t is string => !!t);
	return {
		id: dto.reference,
		title: dto.title,
		project: "",
		icon: ICON,
		description: dto.description,
		token: "USDC",
		rewardAmount: reward,
		escrowBalance: dto.fundingVerified && HELD.has(dto.status) ? reward : 0,
		deadline: dto.deadline,
		requirements: splitLines(dto.requirements),
		acceptanceCriteria: splitLines(dto.acceptanceCriteria),
		issuer: dto.issuerAddress,
		issuerName: "",
		contributor: dto.contributorAddress ?? undefined,
		status: dto.status,
		createdAt: dto.timeline.createdAt ?? times[0] ?? new Date().toISOString(),
		updatedAt: times.sort().at(-1) ?? new Date().toISOString(),
		submissions,
		chain: {
			reward: dto.reward,
			autoReleaseError: dto.autoReleaseError ?? undefined,
			availableActions: dto.availableActions,
			onChain: dto.onChain,
			fundingVerified: dto.fundingVerified,
			fundTxHash: dto.fundTxHash ?? undefined,
			cancelRequestedBy: dto.cancelRequestedBy ?? undefined,
			reviewDueAt: dto.reviewDueAt ?? undefined,
			revisionDueAt: dto.revisionDueAt ?? undefined,
			reclaimAfterAt: dto.reclaimAfterAt ?? undefined,
			revisionCount: dto.revisionCount,
			paidAutomatically: dto.paidAutomatically,
		},
	};
}

/** API lists newest first; the UI keeps submissions oldest first (latest = `.at(-1)`). */
export function toSubmissions(list: SubmissionDto[], status: Bounty["status"]): Submission[] {
	const ordered = [...list].sort((a, b) => a.round - b.round);
	return ordered.map((s, i) => {
		const last = i === ordered.length - 1;
		const approved = last && (status === "approved" || status === "paid");
		return {
			id: s.id,
			deliverableUrl: s.deliverableUrl,
			notes: s.notes ?? "",
			evidence: s.evidenceReference ?? "",
			submittedAt: s.submittedAt,
			review: s.revisionNote
				? { decision: "revision_requested", comment: s.revisionNote, reviewedAt: s.revisionRequestedAt ?? s.submittedAt }
				: approved
					? { decision: "approved", comment: "", reviewedAt: s.submittedAt }
					: undefined,
		};
	});
}

const KIND: Record<string, TxType> = {
	created: "create",
	funded: "fund",
	assigned: "assign",
	accepted: "accept",
	submitted: "submit",
	revision: "request_revision",
	approved: "approve",
	paid: "payout",
	cancelled: "cancel",
	refunded: "refund",
	cancel_req: "cancel_request",
	cancel_clr: "cancel_withdraw",
};

/** Confirmed on-chain events. Unknown kinds are dropped rather than mislabelled. */
export function toTransactions(list: ActivityDto[]): Transaction[] {
	return list.flatMap((a) => {
		const type = KIND[a.kind];
		if (!type) return [];
		return [
			{
				id: a.id,
				hash: a.txHash,
				explorerUrl: a.explorerUrl,
				bountyId: a.reference,
				type,
				amount: a.amount ? Number(a.amount) : undefined,
				from: a.actor ?? "",
				ledger: a.ledger,
				timestamp: a.at,
				status: "success" as const,
			},
		];
	});
}

export function toBalance(account: AccountSummaryDto): Balance {
	const num = (v: string | null | undefined) => (v ? Number(v) : 0);
	return {
		usdc: num(account.assets.find((a) => a.code === "USDC" && !a.native)?.balance),
		xlm: num(account.assets.find((a) => a.native)?.balance),
	};
}
