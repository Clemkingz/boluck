/**
 * Domain types for Boluck.
 *
 * The app renders these whether the data comes from the Boluck API (live mode,
 * mapped in apps/web/src/lib/api/mappers.ts) or from the demo seed data. The
 * escrow on Stellar is the source of truth for funding, authorization and payout.
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

/** On-chain actions the API can prepare (`POST /bounties/{reference}/actions`). */
export type ActionKind =
	| "create"
	| "fund"
	| "assign"
	| "accept"
	| "submit"
	| "request_revision"
	| "approve"
	| "release"
	| "cancel"
	| "request_cancel"
	| "withdraw_cancel"
	| "confirm_cancel"
	| "reclaim"
	| "auto_release";

/** Server-side escrow state that only exists in live mode. */
export interface ChainState {
	/** Exact reward as the API stores it (a decimal string). `Bounty.rewardAmount` is for display only. */
	reward: string;
	/** Why the server's automatic release failed, if it did. */
	autoReleaseError?: string;
	/** Actions the connected wallet may take now. The server decides; the UI only shows them. */
	availableActions: ActionKind[];
	onChain: boolean;
	fundingVerified: boolean;
	fundTxHash?: string;
	/** Who asked to cancel an assigned bounty; the other party confirms. */
	cancelRequestedBy?: string;
	/** When the server releases the reward on its own (review window, or 24 h after an unreleased approval). */
	reviewDueAt?: string;
	revisionDueAt?: string;
	/** After this the issuer can reclaim an unfinished bounty's escrow. */
	reclaimAfterAt?: string;
	revisionCount: number;
	paidAutomatically: boolean;
}

export interface Bounty {
	id: string;
	title: string;
	project: string;
	icon: BountyIcon;
	description: string;
	token: "USDC";
	rewardAmount: number;
	/** Amount currently locked in escrow on Stellar for this bounty. */
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
	/** Live mode only. */
	chain?: ChainState;
}

export type TxType =
	| "create"
	| "fund"
	| "assign"
	| "accept"
	| "submit"
	| "approve"
	| "request_revision"
	| "payout"
	| "cancel"
	| "refund"
	| "cancel_request"
	| "cancel_withdraw";

export interface Transaction {
	/** Event id from the API; demo records use the hash. */
	id?: string;
	hash: string;
	explorerUrl?: string;
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
	/** Escrow action shown in the wallet confirmation (e.g. `fund`). */
	fn?: string;
	/** Live mode: what the dialog is waiting on before the network step. */
	waitingFor?: "prepare" | "wallet";
	/** Live mode: explorer link once confirmed. */
	explorerUrl?: string;
	/** "Step 1 of 2" when one button needs two signatures. */
	step?: string;
	rows?: TxDetailRow[];
	hash?: string;
	error?: string;
}
