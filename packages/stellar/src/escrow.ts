/**
 * Bounty escrow rules.
 *
 * Each guard mirrors a rule from the PRD ("security rules" and "recommended
 * cancellation rules"). In live mode the Boluck API enforces them and reports
 * what is allowed in `availableActions`; these guards are client-side
 * pre-checks there, and the rules of the in-browser demo. A guard returns
 * `null` when allowed, otherwise a human-readable rejection reason.
 */
import type { Balance, Bounty } from "./bounty";
import { isStellarAddress } from "./address";

export type Guard = string | null;

const isIssuer = (b: Bounty, caller?: string) => !!caller && caller === b.issuer;
const isContributor = (b: Bounty, caller?: string) => !!caller && caller === b.contributor;

export function validateReward(amount: number): Guard {
	if (!Number.isFinite(amount) || amount <= 0) return "Reward must be greater than 0.";
	if (amount > 1_000_000) return "Reward exceeds the testnet limit of 1,000,000 USDC.";
	return null;
}

export function canFund(b: Bounty, caller: string | undefined, balance?: Balance): Guard {
	if (!isIssuer(b, caller)) return "Only the designated issuer can fund this bounty.";
	if (b.status !== "draft") return "This bounty is already funded or closed.";
	if (!balance || balance.usdc < b.rewardAmount) return "Insufficient USDC balance to fund the reward.";
	return null;
}

export function canAssign(b: Bounty, caller: string | undefined, contributor: string): Guard {
	if (!isIssuer(b, caller)) return "Only the issuer can assign a contributor.";
	if (b.status !== "funded" || b.contributor) return "A contributor can only be assigned to a funded, unassigned bounty.";
	if (b.escrowBalance < b.rewardAmount) return "Reward is not fully funded.";
	if (!isStellarAddress(contributor)) return "Enter a valid Stellar address (G…, 56 characters).";
	if (contributor === b.issuer) return "The issuer cannot be the contributor.";
	return null;
}

export function canAccept(b: Bounty, caller?: string): Guard {
	if (!isContributor(b, caller)) return "Only the assigned contributor can accept this assignment.";
	if (b.status !== "assigned") return "This bounty is not awaiting acceptance.";
	return null;
}

export function canSubmit(b: Bounty, caller?: string): Guard {
	if (!isContributor(b, caller)) return "Only the assigned contributor can submit work.";
	if (b.status !== "in_progress" && b.status !== "revision_requested")
		return "Work can only be submitted while the bounty is in progress.";
	return null;
}

export function canReview(b: Bounty, caller?: string): Guard {
	if (!isIssuer(b, caller)) return "Only the authorized issuer can review submissions.";
	if (b.status !== "submitted") return "There is no submission awaiting review.";
	return null;
}

export function canRelease(b: Bounty, caller?: string): Guard {
	if (!isIssuer(b, caller)) return "Only the authorized issuer can release payment.";
	if (b.status === "paid") return "This bounty has already been paid.";
	if (b.status !== "approved") return "Payment can only be released after approval.";
	if (!b.contributor) return "No contributor is assigned.";
	if (b.escrowBalance < b.rewardAmount) return "Escrow balance is lower than the reward. Payout blocked.";
	return null;
}

export type CancelRule = "unfunded" | "unassigned" | "assigned" | "paid" | "closed";

export interface CancelPath {
	rule: CancelRule;
	allowed: boolean;
	needsContributor: boolean;
	refund: number;
	reason: string;
}

/** Which cancellation rule applies, and what it means for the refund. */
export function cancellationPath(b: Bounty): CancelPath {
	switch (b.status) {
		case "draft":
			return {
				rule: "unfunded",
				allowed: true,
				needsContributor: false,
				refund: 0,
				reason: "Unfunded — can be cancelled freely. Nothing to refund.",
			};
		case "funded":
			if (!b.contributor)
				return {
					rule: "unassigned",
					allowed: true,
					needsContributor: false,
					refund: b.escrowBalance,
					reason: "Funded and unassigned — the full escrow is refunded.",
				};
		// falls through: a funded bounty with a pre-assigned contributor follows the assigned rule
		case "assigned":
		case "in_progress":
		case "submitted":
		case "revision_requested":
			return {
				rule: "assigned",
				allowed: true,
				needsContributor: true,
				refund: b.escrowBalance,
				reason: "Contributor agreement is needed for an assigned bounty.",
			};
		case "approved":
			return {
				rule: "paid",
				allowed: false,
				needsContributor: false,
				refund: 0,
				reason: "Approved work must be paid out — it can't be refunded.",
			};
		case "paid":
			return { rule: "paid", allowed: false, needsContributor: false, refund: 0, reason: "Already paid. No refund is possible." };
		case "cancelled":
		case "refunded":
			return { rule: "closed", allowed: false, needsContributor: false, refund: 0, reason: "This bounty is already closed." };
	}
}

export function canCancel(b: Bounty, caller: string | undefined, contributorAgreed: boolean): Guard {
	if (!isIssuer(b, caller)) return "Only the issuer may cancel or refund.";
	const path = cancellationPath(b);
	if (!path.allowed) return path.reason;
	if (path.needsContributor && !contributorAgreed)
		return "The assigned contributor must agree before this bounty can be cancelled.";
	return null;
}
