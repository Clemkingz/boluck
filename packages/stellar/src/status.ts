import type { BountyStatus, TxType } from "./bounty";

/** Visual tone for each status; matches the Badge tones in @repo/ui. */
export type Tone = "neutral" | "primary" | "highlight" | "active" | "review" | "attention";

export const STATUS_META: Record<BountyStatus, { label: string; tone: Tone; description: string }> = {
	draft: { label: "Draft", tone: "primary", description: "Bounty created but not yet funded" },
	funded: { label: "Funded", tone: "highlight", description: "Reward locked in escrow" },
	assigned: { label: "Assigned", tone: "active", description: "Contributor selected" },
	in_progress: { label: "In progress", tone: "active", description: "Contributor accepted assignment" },
	submitted: { label: "Submitted", tone: "review", description: "Work delivered for review" },
	revision_requested: { label: "Revision requested", tone: "attention", description: "Issuer requested changes" },
	approved: { label: "Approved", tone: "highlight", description: "Issuer accepted deliverable" },
	paid: { label: "Paid", tone: "highlight", description: "Reward successfully transferred" },
	cancelled: { label: "Cancelled", tone: "neutral", description: "Bounty cancelled under valid conditions" },
	refunded: { label: "Refunded", tone: "attention", description: "Eligible funds returned to issuer" },
};

/** The six-step lifecycle shown in the design's stepper. */
export const STEPS: { key: BountyStatus; label: string }[] = [
	{ key: "draft", label: "Created" },
	{ key: "funded", label: "Funded" },
	{ key: "assigned", label: "Assigned" },
	{ key: "in_progress", label: "In progress" },
	{ key: "submitted", label: "Submitted" },
	{ key: "paid", label: "Paid" },
];

/** Number of completed steps for a status (the next step is the current one). */
export function stepIndex(status: BountyStatus) {
	switch (status) {
		case "draft":
			return 1;
		case "funded":
		case "assigned":
			return 2;
		case "in_progress":
		case "revision_requested":
			return 3;
		case "submitted":
			return 4;
		case "approved":
			return 5;
		case "paid":
			return 6;
		default:
			return 0;
	}
}

export const ACTIVE_STATUSES: BountyStatus[] = [
	"funded",
	"assigned",
	"in_progress",
	"submitted",
	"revision_requested",
	"approved",
];

export const TX_META: Record<TxType, { label: string; kind: "escrow" | "payout" | "refund" | "work" }> = {
	create: { label: "Bounty created", kind: "work" },
	fund: { label: "Escrow funded", kind: "escrow" },
	assign: { label: "Contributor assigned", kind: "work" },
	accept: { label: "Assignment accepted", kind: "work" },
	submit: { label: "Work submitted", kind: "work" },
	approve: { label: "Submission approved", kind: "work" },
	request_revision: { label: "Revision requested", kind: "work" },
	payout: { label: "Payment released", kind: "payout" },
	cancel: { label: "Bounty cancelled", kind: "refund" },
	refund: { label: "Escrow refunded", kind: "refund" },
};
