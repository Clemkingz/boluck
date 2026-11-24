/**
 * Domain types for Boluck.
 *
 * These mirror what the bounty escrow contract (source of truth for
 * funding, escrow balance, authorization and payout status) plus the metadata
 * backend will expose. Until those exist, everything is served from mock data.
 */

export type BountyStatus =
	| "draft"
	| "funded"
	| "assigned"
	| "in_progress"
	| "submitted"
	| "revision_requested"
	| "approved"
	| "paid"
	| "cancelled"
	| "refunded";

export type Role = "issuer" | "contributor";

export type WalletId = "freighter" | "xbull" | "albedo" | "lobstr" | "rabet" | "hana";

export type BountyIcon = "layout" | "code" | "sparkle" | "doc" | "shield" | "palette";

export interface ReviewDecision {
	decision: "approved" | "revision_requested";
	comment: string;
	reviewedAt: string;
}

export interface Submission {
	id: string;
	deliverableUrl: string;
	notes: string;
	evidence: string;
	submittedAt: string;
	review?: ReviewDecision;
}

export interface Cancellation {
	reason: string;
	cancelledAt: string;
	contributorAgreed: boolean;
}

export interface Bounty {
	id: string;
	title: string;
	project: string;
	icon: BountyIcon;
	description: string;
	token: "USDC";
	rewardAmount: number;
	/** Amount currently locked in the escrow contract for this bounty. */
	escrowBalance: number;
	deadline: string;
	requirements: string[];
	acceptanceCriteria: string[];
	issuer: string;
	issuerName: string;
	contributor?: string;
	status: BountyStatus;
	createdAt: string;
	updatedAt: string;
	submissions: Submission[];
	cancellation?: Cancellation;
}

export type TxType =
	"create" | "fund" | "assign" | "accept" | "submit" | "approve" | "request_revision" | "payout" | "cancel" | "refund";

export interface Transaction {
	hash: string;
	bountyId: string;
	type: TxType;
	amount?: number;
	from: string;
	to?: string;
	ledger: number;
	timestamp: string;
	status: "success" | "failed";
}

export interface Balance {
	usdc: number;
	xlm: number;
}

export interface DemoAccount {
	address: string;
	name: string;
	initials: string;
	role: Role;
}

export type TxStage = "idle" | "authorize" | "pending" | "success" | "error";

export interface TxDetailRow {
	label: string;
	value: string;
}

export interface TxState {
	stage: TxStage;
	title: string;
	/** Short line under the title, e.g. "Lock 300.00 USDC in escrow". */
	summary?: string;
	/** Contract function name shown in the wallet confirmation. */
	fn?: string;
	rows?: TxDetailRow[];
	hash?: string;
	error?: string;
}
