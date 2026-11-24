/**
 * Client for the Boluck API's admin routes (and the wallet sign-in they sit behind). Unwraps the
 * `{ statusCode, message, data }` envelope and throws `ApiError` with the server's message, which is written to be
 * shown to people as is (docs/FRONTEND_INTEGRATION.md §3).
 */
import type { ChallengeDto, Envelope, ErrorBody, WalletSessionDto, WalletTokenDto } from "./types";

/** Includes `/api/v1`. Defaults to this app's own proxied path (next.config.ts), so no CORS. */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
		readonly code?: string,
		readonly requestId?: string,
		readonly retryAfterSeconds?: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (value: string | null) => {
	token = value;
};
export const setUnauthorizedHandler = (fn: () => void) => {
	onUnauthorized = fn;
};

export async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
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
	const json = (await res.json().catch(() => null)) as Envelope<T> | ErrorBody | null;
	if (res.ok && json) return (json as Envelope<T>).data;

	const err = json as ErrorBody | null;
	if (res.status === 401 && auth && token) onUnauthorized?.();
	const retry = err?.error?.retryAfterSeconds ?? (Number(res.headers.get("retry-after")) || undefined);
	const requestId = err?.error?.requestId;
	let message =
		res.status === 429
			? `Too many requests. Try again in ${retry ?? "a few"} seconds.`
			: (err?.message ?? "Something went wrong.");
	if (res.status >= 500 && requestId) message += ` (reference ${requestId})`;
	throw new ApiError(message, res.status, err?.error?.code, requestId, retry);
}

/** `?a=1&b=x`, skipping empty values. */
export const query = (params: Record<string, string | number | boolean | undefined | null>) => {
	const s = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
	const str = s.toString();
	return str ? `?${str}` : "";
};

/** Wallet sign-in (shared with the product app). */
export const auth = {
	challenge: (address: string) =>
		request<ChallengeDto>("/wallet-auth/challenge", { method: "POST", body: { address }, auth: false }),
	verify: (transaction: string) =>
		request<WalletTokenDto>("/wallet-auth/verify", { method: "POST", body: { transaction }, auth: false }),
	session: () => request<WalletSessionDto>("/wallet-auth/session"),
	logout: () => request<void>("/wallet-auth/logout", { method: "POST" }),
};
