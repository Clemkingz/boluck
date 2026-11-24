/**
 * Thin client for the Boluck API. Unwraps the `{ statusCode, message, data }` envelope and throws
 * `ApiError` with the server's message, which is written to be shown to people as is.
 */
import { API_URL } from "./config";
import type {
	AccountSummaryDto,
	ActionDto,
	ActivityDto,
	ApiErrorBody,
	BountyDto,
	ChallengeDto,
	DashboardDto,
	Envelope,
	EscrowConfigDto,
	NetworkInfoDto,
	NotificationDto,
	Page,
	PrepareActionDto,
	SaveBountyDto,
	SubmissionDto,
	WalletSessionDto,
	WalletTokenDto,
} from "./types";

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code?: string,
		readonly fields?: { field: string; message: string }[],
		readonly retryAfterSeconds?: number,
		readonly requestId?: string,
		readonly details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** The wallet session token. Held in memory here; the store persists it. */
export const setToken = (value: string | null) => {
	token = value;
};
/** Called when an authenticated request comes back 401 (expired or revoked session). */
export const setUnauthorizedHandler = (fn: () => void) => {
	onUnauthorized = fn;
};

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
	const { method = "GET", body, auth = true } = init;
	const headers: Record<string, string> = { accept: "application/json" };
	if (body !== undefined) headers["content-type"] = "application/json";
	if (auth && token) headers.authorization = `Bearer ${token}`;

	let res: Response;
	try {
		res = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
	} catch {
		throw new ApiError("Can't reach Boluck right now. Check your connection and try again.", 0, "NETWORK");
	}

	if (res.status === 204) return undefined as T;
	const json = (await res.json().catch(() => null)) as Envelope<T> | ApiErrorBody | null;
	if (res.ok && json) return (json as Envelope<T>).data;

	const err = json as ApiErrorBody | null;
	if (res.status === 401 && auth && token) onUnauthorized?.();
	const retry = err?.error?.retryAfterSeconds ?? (Number(res.headers.get("retry-after")) || undefined);
	const requestId = err?.error?.requestId;
	let message =
		res.status === 429
			? `Too many requests. Try again in ${retry ?? "a few"} seconds.`
			: (err?.message ?? "Something went wrong. Please try again.");
	// Unexpected failures: include the request id so support can find the log.
	if (res.status >= 500 && requestId) message += ` (reference ${requestId})`;
	throw new ApiError(message, res.status, err?.error?.code, err?.error?.fields, retry, requestId, err?.error?.details);
}

const q = (params: Record<string, string | number | undefined>) => {
	const s = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (v !== undefined) s.set(k, String(v));
	const str = s.toString();
	return str ? `?${str}` : "";
};

export const api = {
	network: () => request<NetworkInfoDto>("/stellar/network", { auth: false }),
	account: (address: string) => request<AccountSummaryDto>(`/stellar/accounts/${address}`, { auth: false }),

	challenge: (address: string) =>
		request<ChallengeDto>("/wallet-auth/challenge", { method: "POST", body: { address }, auth: false }),
	verify: (transaction: string) =>
		request<WalletTokenDto>("/wallet-auth/verify", { method: "POST", body: { transaction }, auth: false }),
	session: () => request<WalletSessionDto>("/wallet-auth/session"),
	logout: () => request<void>("/wallet-auth/logout", { method: "POST" }),

	escrowConfig: () => request<EscrowConfigDto>("/escrow/config", { auth: false }),
	dashboard: () => request<DashboardDto>("/dashboard"),

	bounties: (params: { limit?: number; offset?: number; role?: "issuer" | "contributor" } = {}) =>
		request<Page<BountyDto>>(`/bounties${q({ limit: 100, ...params })}`),
	bounty: (ref: string) => request<BountyDto>(`/bounties/${encodeURIComponent(ref)}`),
	createDraft: (body: SaveBountyDto) => request<BountyDto>("/bounties", { method: "POST", body }),
	updateDraft: (ref: string, body: Partial<SaveBountyDto>) =>
		request<BountyDto>(`/bounties/${encodeURIComponent(ref)}`, { method: "PATCH", body }),
	deleteDraft: (ref: string) => request<void>(`/bounties/${encodeURIComponent(ref)}`, { method: "DELETE" }),
	activity: (ref: string) => request<ActivityDto[]>(`/bounties/${encodeURIComponent(ref)}/activity`),
	submissions: (ref: string) => request<SubmissionDto[]>(`/bounties/${encodeURIComponent(ref)}/submissions`),

	transactions: (params: { limit?: number; offset?: number } = {}) =>
		request<Page<ActivityDto>>(`/transactions${q({ limit: 100, ...params })}`),
	notifications: (params: { limit?: number; offset?: number } = {}) =>
		request<Page<NotificationDto> & { unread: number }>(`/notifications${q({ limit: 30, ...params })}`),
	readAllNotifications: () => request<void>("/notifications/read-all", { method: "POST" }),
	readNotification: (id: string) => request<void>(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" }),

	prepareAction: (ref: string, body: PrepareActionDto) =>
		request<ActionDto>(`/bounties/${encodeURIComponent(ref)}/actions`, { method: "POST", body }),
	submitAction: (id: string, signedTransaction: string) =>
		request<ActionDto>(`/actions/${encodeURIComponent(id)}/submit`, { method: "POST", body: { signedTransaction } }),
	action: (id: string) => request<ActionDto>(`/actions/${encodeURIComponent(id)}`),
};
