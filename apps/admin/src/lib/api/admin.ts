/**
 * Admin routes of the Boluck API (`/api/v1/admin/*`, all behind a wallet session on the admin allow-list).
 *
 * Paths and query parameters follow `/docs-json`. The spec doesn't describe the responses yet, so the response types
 * below are provisional: they are replaced with the real shapes once an allow-listed wallet can read them.
 */
import { query, request } from "./client";
import type { Page } from "./types";

/** TODO(shapes): confirm against a live `GET /admin/me`. */
export type AdminMe = { address: string } & Record<string, unknown>;
export type AdminOverview = Record<string, unknown>;
export type AdminSystem = Record<string, unknown>;
export type AdminBounty = { reference: string } & Record<string, unknown>;
export type AdminBountyDetail = Record<string, unknown>;
export type AdminTransaction = { id: string } & Record<string, unknown>;
export type AdminWallet = { address: string } & Record<string, unknown>;
export type AdminWalletDetail = Record<string, unknown>;

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
	runWorker: () => request<unknown>("/admin/worker/run", { method: "POST" }),

	wallets: (p: { limit?: number; offset?: number; search?: string } = {}) =>
		request<Page<AdminWallet>>(`/admin/wallets${query({ limit: 20, ...p })}`),
	wallet: (address: string) => request<AdminWalletDetail>(`/admin/wallets/${ref(address)}`),
	/** Signs the wallet out everywhere; it can sign in again with its own key. */
	revokeSessions: (address: string) => request<unknown>(`/admin/wallets/${ref(address)}/sessions/revoke`, { method: "POST" }),
};
