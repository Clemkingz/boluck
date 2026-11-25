/**
 * Admin routes of the Boluck API (`/api/v1/admin/*`, all behind a wallet session on the admin allow-list).
 *
 * Paths and query parameters follow `/docs-json`; the response types were taken from live Testnet responses (the spec
 * doesn't describe them yet).
 */
import { query, request } from "./client";
import type { Page } from "./types";

export interface AdminMe {
	address: string;
	isAdmin: boolean;
}

export interface AdminOverview {
	bounties: {
		total: number;
		byStatus: Record<BountyStatusFilter, number>;
		needsAttention: Record<BountyFlag, number>;
	};
	/** Decimal strings in `asset` units. */
	funds: {
		asset: string;
		locked: string;
		awaitingRelease: string;
		underReview: string;
		paid: string;
		refunded: string;
		openBalances: number;
		paidAutomatically: number;
	};
	transactions: Record<TxStatusFilter, number> & { stuck: number; failedLast24Hours: number; rejected: number };
	wallets: number;
}

export type ServiceState = "up" | "down" | (string & {});

export interface AdminSystem {
	services: Record<"database" | "redis" | "horizon", ServiceState> & Record<string, ServiceState>;
	network: string;
	escrowConfigured: boolean;
	asset: string;
	rules: {
		gracePeriodDays: number;
		reviewWindowDays: number;
		revisionWindowDays: number;
		maxRevisions: number;
		recoveryDaysAfterDeadline: number;
		autoReleaseApprovedDelaySeconds: number;
	};
	arbiter: {
		status: "ok" | (string & {});
		address: string;
		explorerUrl: string;
		xlmBalance: string;
		assetBalance: string;
		reservedXlm: number;
		openBalances: number;
	};
	worker: { intervalSeconds: number; enabled: boolean };
	indexer: { lastIndexedLedger: number; cursorUpdatedAt: string | null };
}

export interface AdminBounty {
	reference: string;
	status: BountyStatusFilter;
	onChain: boolean;
	title: string;
	reward: string;
	asset: string;
	deadline: string;
	issuerAddress: string;
	contributorAddress: string | null;
	fundingVerified: boolean;
	revisionCount: number;
	reclaimAfterAt: string | null;
	reviewDueAt: string | null;
	revisionDueAt: string | null;
	recoveryAt: string | null;
	pastRecovery: boolean;
	cancelRequestedBy: string | null;
	paidAutomatically: boolean;
	autoReleaseError: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface TxRef {
	hash: string;
	explorerUrl: string;
}

export interface AdminTransaction {
	id: string;
	reference: string;
	bountyTitle: string;
	kind: ActionKindFilter;
	status: TxStatusFilter;
	signer: string;
	hash: string;
	amount: string | null;
	ledger: number | null;
	failureCode: string | null;
	failure: unknown;
	failureCodes: unknown;
	/** Recorded on Stellar but not applied (e.g. a late signature after the bounty moved on). */
	rejection: unknown;
	/** Pending for over 5 minutes. */
	stuck: boolean;
	explorerUrl: string | null;
	createdAt: string;
	submittedAt: string | null;
	settledAt: string | null;
	expiresAt: string | null;
}

export interface AdminSubmission {
	id: string;
	round: number;
	contributorAddress: string;
	deliverableUrl: string;
	notes: string | null;
	evidenceReference: string | null;
	workHash: string;
	tx: TxRef | null;
	revisionNote: string | null;
	revisionRequestedAt: string | null;
	submittedAt: string;
}

export interface AdminActivity {
	id: string;
	kind: string;
	actor: string | null;
	amount: string | null;
	tx: TxRef | null;
	ledger: number;
	at: string;
}

export interface AdminBountyDetail extends AdminBounty {
	description: string;
	requirements: string;
	acceptanceCriteria: string;
	network: string;
	version: number;
	metadataHash: string | null;
	balanceId: string | null;
	fundTx: TxRef | null;
	autoReleaseAttemptAt: string | null;
	timeline: Record<string, string | null>;
	submissions: AdminSubmission[];
	transactions: AdminTransaction[];
	activity: AdminActivity[];
}

export interface AdminWallet {
	address: string;
	shortAddress: string;
	bountiesIssued: number;
	bountiesContributed: number;
}

export interface AdminWalletDetail {
	address: string;
	shortAddress: string;
	explorerUrl: string;
	sessions: number;
	activeSessions: number;
	lastSeenAt: string | null;
	bounties: (AdminBounty & { walletRole: "issuer" | "contributor" })[];
}

export type BountyStatusFilter =
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

/** Attention flags the API can filter bounties by. */
export type BountyFlag = "cancel_requested" | "auto_release_failed" | "review_overdue" | "recovery_soon" | "past_recovery";

export type TxStatusFilter = "prepared" | "pending" | "confirmed" | "failed" | "expired";

export type ActionKindFilter =
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

const ref = (v: string) => encodeURIComponent(v);

export const admin = {
	me: () => request<AdminMe>("/admin/me"),
	overview: () => request<AdminOverview>("/admin/overview"),
	system: () => request<AdminSystem>("/admin/system"),

	bounties: (p: { limit?: number; offset?: number; status?: BountyStatusFilter; flag?: BountyFlag; search?: string } = {}) =>
		request<Page<AdminBounty>>(`/admin/bounties${query({ limit: 20, ...p })}`),
	bounty: (reference: string) => request<AdminBountyDetail>(`/admin/bounties/${ref(reference)}`),
	/** Clears the auto-release back-off; the worker still checks every rule before paying. */
	retryAutoRelease: (reference: string) =>
		request<unknown>(`/admin/bounties/${ref(reference)}/auto-release/retry`, { method: "POST" }),

	transactions: (
		p: {
			limit?: number;
			offset?: number;
			status?: TxStatusFilter;
			kind?: ActionKindFilter;
			stuck?: boolean;
			rejected?: boolean;
			search?: string;
		} = {},
	) => request<Page<AdminTransaction>>(`/admin/transactions${query({ limit: 20, ...p })}`),
	/** Re-reads an open transaction's result from Stellar. Can't sign, submit or move funds. */
	reconcile: (id: string) => request<unknown>(`/admin/transactions/${ref(id)}/reconcile`, { method: "POST" }),

	/** One worker pass now: sync with Stellar, settle open transactions, run auto-releases already due. */
	runWorker: () => request<AdminSystem>("/admin/worker/run", { method: "POST" }),

	wallets: (p: { limit?: number; offset?: number; search?: string } = {}) =>
		request<Page<AdminWallet>>(`/admin/wallets${query({ limit: 20, ...p })}`),
	wallet: (address: string) => request<AdminWalletDetail>(`/admin/wallets/${ref(address)}`),
	/** Signs the wallet out everywhere; it can sign in again with its own key. */
	revokeSessions: (address: string) =>
		request<{ address: string; revokedSessions: number }>(`/admin/wallets/${ref(address)}/sessions/revoke`, { method: "POST" }),
};
