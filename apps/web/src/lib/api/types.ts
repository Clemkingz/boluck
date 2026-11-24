/**
 * Response shapes of the Boluck API (`/docs-json`). Only some of them are in the OpenAPI spec; the
 * rest were taken from live Testnet responses and should move to the spec when the backend adds them.
 */
import type { ActionKind, BountyStatus } from "@repo/stellar/bounty";

export interface Envelope<T> {
	statusCode: number;
	message: string;
	data: T;
}

export interface ApiErrorBody {
	statusCode: number;
	message: string;
	data: null;
	error?: {
		code: string;
		fields?: { field: string; message: string }[];
		details?: unknown;
		retryAfterSeconds?: number;
		requestId?: string;
	};
}

export interface Page<T> {
	result: T[];
	paginationMeta: {
		nextPage: boolean;
		previousPage: boolean;
		currentPage: number;
		totalPage: number;
		totalCount: number;
		pageCount: number;
	};
}

export interface AssetDto {
	id: string;
	code: string;
	issuer: string | null;
	native: boolean;
}

export interface NetworkInfoDto {
	network: "testnet" | "mainnet";
	networkPassphrase: string;
	horizonUrl: string;
	explorerUrl: string;
	assets: AssetDto[];
	platformAccount: string | null;
}

export interface AccountSummaryDto {
	address: string;
	shortAddress: string;
	exists: boolean;
	explorerUrl: string;
	assets: (AssetDto & { trusted: boolean; balance: string | null })[];
}

export interface ChallengeDto {
	transaction: string;
	networkPassphrase: string;
	homeDomain: string;
	expiresAt: string;
}

export interface WalletSessionDto {
	address: string;
	shortAddress: string;
	networkPassphrase: string;
	expiresAt: string;
}

export interface WalletTokenDto extends WalletSessionDto {
	walletToken: string;
	tokenType: "Bearer";
	expiresIn: number;
}

export interface EscrowConfigDto {
	configured: boolean;
	autoReleaseEnabled: boolean;
	network: string;
	networkPassphrase: string;
	arbiter: string;
	asset: string;
	gracePeriodDays: number;
	reviewWindowDays: number;
	revisionWindowDays: number;
	recoveryDaysAfterDeadline: number;
	maxRevisions: number;
}

export interface BountyDto {
	reference: string;
	status: BountyStatus;
	onChain: boolean;
	role: "issuer" | "contributor";
	title: string;
	description: string;
	requirements: string;
	acceptanceCriteria: string;
	reward: string;
	asset: string;
	deadline: string;
	issuerAddress: string;
	contributorAddress: string | null;
	fundingVerified: boolean;
	balanceId: string | null;
	recoveryAt: string | null;
	fundTxHash: string | null;
	metadataHash: string | null;
	revisionCount: number;
	reclaimAfterAt: string | null;
	reviewDueAt: string | null;
	revisionDueAt: string | null;
	cancelRequestedBy: string | null;
	paidAutomatically: boolean;
	autoReleaseError: string | null;
	availableActions: ActionKind[];
	timeline: Record<
		| "createdAt"
		| "onChainAt"
		| "fundedAt"
		| "assignedAt"
		| "acceptedAt"
		| "submittedAt"
		| "approvedAt"
		| "paidAt"
		| "cancelledAt"
		| "refundedAt",
		string | null
	>;
}

export interface SaveBountyDto {
	title: string;
	description: string;
	requirements: string;
	acceptanceCriteria: string;
	rewardAmount: string;
	deadline: string;
	contributorAddress?: string;
}

/** Event kinds seen in activity and transaction history. */
export type ActivityKind =
	| "created"
	| "funded"
	| "assigned"
	| "accepted"
	| "submitted"
	| "revision"
	| "approved"
	| "paid"
	| "cancelled"
	| "refunded"
	| "cancel_req"
	| "cancel_clr";

export interface ActivityDto {
	id: string;
	reference: string;
	kind: ActivityKind | (string & {});
	actor: string | null;
	amount: string | null;
	txHash: string;
	ledger: number;
	explorerUrl: string;
	at: string;
}

export interface SubmissionDto {
	id: string;
	round: number;
	contributorAddress: string;
	deliverableUrl: string;
	notes: string | null;
	evidenceReference: string | null;
	workHash: string;
	txHash: string;
	explorerUrl: string;
	revisionNote: string | null;
	revisionRequestedAt: string | null;
	submittedAt: string;
}

export interface DashboardDto {
	activeBounties: number;
	drafts: number;
	pendingSubmissions: number;
	completedPayouts: number;
	fundedRewards: string;
	earned: string;
	asset: string;
	unreadNotifications: number;
	recentActivity: ActivityDto[];
}

export interface NotificationDto {
	id: string;
	reference: string;
	title: string;
	read: boolean;
	at: string;
}

export interface ActionDto {
	id: string;
	kind: ActionKind;
	status: "prepared" | "pending" | "confirmed" | "failed" | "expired" | (string & {});
	hash: string;
	amount: string | null;
	/** Unsigned XDR while `prepared`; null afterwards. */
	transaction: string | null;
	networkPassphrase: string;
	expiresAt: string;
	ledger: number | null;
	explorerUrl: string | null;
	statusMessage: string;
	failureCode: string | null;
	failure: unknown;
}

export interface PrepareActionDto {
	kind: ActionKind;
	contributor?: string;
	submission?: { deliverableUrl: string; notes?: string; evidenceReference?: string };
	note?: string;
}
