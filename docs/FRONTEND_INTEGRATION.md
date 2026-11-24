# Boluck Frontend Integration Guide

This file is the API contract for the Boluck web frontend. It covers wallet sign-in, every bounty flow, and every error the UI needs to handle.

## 1. Rules that must not be broken

1. **Never submit a transaction to Stellar yourself.** The wallet signs only. Send the signed XDR to `POST /actions/{id}/submit`. Fund, release, refund, and auto-release need a second server signature and fail if submitted directly.
2. **Sign the returned XDR unchanged.** Editing the fee, memo, or time bounds changes its hash, and the API rejects it.
3. **Never ask for a secret key or seed phrase.**
4. **The backend owns state.** Never set a status optimistically. Refetch the bounty after every action.
5. **A `200` from submit is not success.** Read `data.status`. Only `confirmed` means the action happened.
6. **Use `availableActions` to show buttons.** Do not re-implement the rules in the UI.
7. **Amounts are decimal strings.** Never use floats for money.
8. **There is no Soroban contract.** Escrow uses Stellar claimable balances, so do not show a contract address or say a smart contract holds the funds. Say "locked in escrow on Stellar".
9. **Render user text as text.** Titles, notes, and descriptions are plain text, so never inject them as HTML. Open deliverable links with `rel="noopener noreferrer"`.

## 2. Connection

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

- The URL includes `/api/v1` and has no trailing slash.
- The frontend origin must be in the backend's `FRONTEND_URL` or `CORS_ORIGINS`.
- Interactive docs are at `http://localhost:4000/docs` when Swagger is on.
- Read the network, arbiter, asset, and timing rules from `GET /escrow/config` instead of hardcoding them.

```json
{
	"configured": true,
	"autoReleaseEnabled": true,
	"network": "testnet",
	"networkPassphrase": "Test SDF Network ; September 2015",
	"arbiter": "G...",
	"asset": "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
	"gracePeriodDays": 3,
	"reviewWindowDays": 7,
	"revisionWindowDays": 7,
	"recoveryDaysAfterDeadline": 66,
	"maxRevisions": 3
}
```

If `configured` is `false`, disable on-chain buttons and show that payments are temporarily unavailable.

## 3. Response and error format

Success:

```json
{ "statusCode": 200, "message": "Bounty loaded", "data": {} }
```

Paginated `data`. Use `?limit=20&offset=0`:

```json
{
	"result": [],
	"paginationMeta": {
		"nextPage": false,
		"previousPage": false,
		"currentPage": 1,
		"totalPage": 1,
		"totalCount": 0,
		"pageCount": 0
	}
}
```

Every error:

```json
{
	"statusCode": 400,
	"message": "Please fix the 2 highlighted fields.",
	"data": null,
	"error": {
		"code": "VALIDATION_FAILED",
		"fields": [{ "field": "rewardAmount", "message": "Enter a reward above 0..." }],
		"details": {},
		"retryAfterSeconds": null,
		"requestId": "...",
		"traceId": "...",
		"timestamp": "2026-12-01T12:00:00.000Z",
		"path": "/api/v1/bounties"
	}
}
```

How to handle an error:

- **`message`** is safe to show to users.
- **`error.code`** is stable. Branch on it, never on the message.
- **`error.fields`** maps to form inputs. Show each message beside its field. Nested fields use dots, such as `submission.deliverableUrl`.
- **`error.details`** holds structured facts, such as `shortfall`.
- **`429`** includes `retryAfterSeconds`. Disable the button for that long.
- **`401`** means the session ended. Clear the token and prompt to reconnect.
- Show `requestId` in unexpected error states so support can find the log.

```ts
export class ApiError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
		readonly fields: { field: string; message: string }[] = [],
		readonly details: Record<string, unknown> = {},
		readonly retryAfterSeconds: number | null = null,
		readonly requestId?: string,
	) {
		super(message);
	}
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
	const token = sessionStorage.getItem("walletToken");
	let res: Response;
	try {
		res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
			...init,
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...init.headers,
			},
		});
	} catch {
		throw new ApiError(0, "NETWORK_ERROR", "Cannot reach Boluck. Check your connection.");
	}
	if (res.status === 204) return undefined as T;
	const body = await res.json().catch(() => null);
	if (!res.ok) {
		if (res.status === 401) sessionStorage.removeItem("walletToken");
		const e = body?.error ?? {};
		throw new ApiError(
			res.status,
			e.code ?? "UNKNOWN_ERROR",
			body?.message ?? "Something went wrong. Please try again.",
			e.fields,
			e.details,
			e.retryAfterSeconds ?? null,
			e.requestId,
		);
	}
	return body.data as T;
}
```

## 4. Wallet sign-in

1. `POST /wallet-auth/challenge` with `{ "address": "G..." }`. Returns `{ transaction, networkPassphrase, homeDomain, expiresAt }`.
2. Check the wallet's network matches `networkPassphrase`, then sign `transaction`. This moves no funds.
3. `POST /wallet-auth/verify` with `{ "transaction": "<signed XDR>" }`. Returns `{ walletToken, tokenType, expiresIn, ... }`.
4. Send `Authorization: Bearer <walletToken>` on every other request.

| Route                      | Purpose                            |
| -------------------------- | ---------------------------------- |
| `GET /wallet-auth/session` | Current session. Call on page load |
| `POST /wallet-auth/logout` | Revokes the session                |

Keep the token in memory or `sessionStorage`, not `localStorage`. When the user switches accounts in the wallet, log out and sign in again, because actions must be signed by the session's wallet.

## 5. Bounty routes

All routes need a wallet session unless noted. A wallet that is not a party gets `404 BOUNTY_NOT_FOUND`.

| Method and path                                     | Purpose                                            |
| --------------------------------------------------- | -------------------------------------------------- |
| `GET /escrow/config`                                | Public settings                                    |
| `GET /stellar/accounts/{address}`                   | Public. Wallet balances for the fund screen        |
| `POST /bounties`                                    | Create a draft                                     |
| `GET /bounties?role=issuer\|contributor&status=...` | List                                               |
| `GET /bounties/{reference}`                         | Details, such as `BL-1001`                         |
| `PATCH /bounties/{reference}`                       | Edit a draft that is not on chain                  |
| `DELETE /bounties/{reference}`                      | Delete a draft that is not on chain. Returns `204` |
| `GET /bounties/{reference}/activity`                | Verified on-chain history                          |
| `GET /bounties/{reference}/submissions`             | Submissions, newest first                          |
| `POST /bounties/{reference}/actions`                | Prepare an on-chain action                         |
| `POST /actions/{id}/submit`                         | Submit the signed transaction                      |
| `GET /actions/{id}`                                 | Poll an action                                     |
| `GET /dashboard`                                    | Totals and recent activity                         |
| `GET /transactions`                                 | Paginated history with explorer links              |
| `GET /notifications`                                | Paginated, with `unread` beside `result`           |
| `POST /notifications/{id}/read`                     | Mark one read. Returns `204`                       |
| `POST /notifications/read-all`                      | Mark all read. Returns `204`                       |

### Draft fields

All are optional while drafting and required before the `create` action.

| Field                                               | Rules                                                    |
| --------------------------------------------------- | -------------------------------------------------------- |
| `title`                                             | Up to 120 characters                                     |
| `description`, `requirements`, `acceptanceCriteria` | Up to 5,000 characters each                              |
| `rewardAmount`                                      | String above 0 with up to 2 decimals, such as `"300.00"` |
| `deadline`                                          | ISO date with a timezone, in the future, within 365 days |
| `contributorAddress`                                | `G...` address, not the issuer. Send `""` to clear       |

### Bounty object

```json
{
	"reference": "BL-1001",
	"status": "submitted",
	"onChain": true,
	"role": "issuer",
	"title": "Build a landing page",
	"description": "...",
	"requirements": "...",
	"acceptanceCriteria": "...",
	"reward": "300",
	"asset": "USDC:G...",
	"deadline": "2026-12-15T17:00:00.000Z",
	"issuerAddress": "G...",
	"contributorAddress": "G...",
	"fundingVerified": true,
	"balanceId": "00000000ab12...",
	"recoveryAt": "2027-02-19T17:00:00.000Z",
	"fundTxHash": "...",
	"metadataHash": "...",
	"revisionCount": 1,
	"reclaimAfterAt": "2026-12-18T17:00:00.000Z",
	"reviewDueAt": "2026-12-10T12:00:00.000Z",
	"revisionDueAt": null,
	"cancelRequestedBy": null,
	"paidAutomatically": false,
	"autoReleaseError": null,
	"availableActions": ["approve", "request_revision", "request_cancel"],
	"timeline": { "createdAt": "...", "fundedAt": "...", "paidAt": null }
}
```

## 6. Status and UI

| Status                    | Show                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `draft`, `onChain: false` | Draft. Editable                                                 |
| `draft`, `onChain: true`  | Published, awaiting funding                                     |
| `funded`                  | Reward locked, no contributor assigned                          |
| `assigned`                | Waiting for the contributor to accept                           |
| `in_progress`             | Work under way                                                  |
| `submitted`               | In review. **Show a countdown to `reviewDueAt`**                |
| `revision_requested`      | Needs changes. **Show a countdown to `revisionDueAt`**          |
| `approved`                | Approved, awaiting payment                                      |
| `paid`                    | Paid. If `paidAutomatically`, label it "Released automatically" |
| `cancelled`               | Cancelled before funding                                        |
| `refunded`                | Reward returned to the issuer                                   |

Warn the issuer clearly on `submitted`: **"Review by {reviewDueAt} or the reward releases automatically."** Issuers only receive in-app notifications, so this message matters.

## 7. On-chain actions

Every action uses the same three steps.

```ts
import { signTransaction } from "@stellar/freighter-api";

type Action = {
	id: string;
	status: "prepared" | "pending" | "confirmed" | "failed" | "expired";
	transaction: string | null;
	networkPassphrase: string;
	statusMessage: string;
	failureCode: string | null;
	explorerUrl: string | null;
	hash: string;
};

export async function runAction(
	reference: string,
	body: { kind: string; contributor?: string; note?: string; submission?: object },
	address: string,
): Promise<Action> {
	// 1. Prepare. Validation and rule errors are thrown here.
	const prepared = await api<Action>(`/bounties/${reference}/actions`, {
		method: "POST",
		body: JSON.stringify(body),
	});

	// 2. Sign without changing it.
	const signed = await signTransaction(prepared.transaction!, {
		networkPassphrase: prepared.networkPassphrase,
		address,
	});
	if (signed.error) throw new ApiError(0, "WALLET_REJECTED", "You cancelled the request in your wallet.");

	// 3. Submit.
	let action = await api<Action>(`/actions/${prepared.id}/submit`, {
		method: "POST",
		body: JSON.stringify({ signedTransaction: signed.signedTxXdr }),
	});

	// 4. The answer may still be on its way.
	for (let i = 0; action.status === "pending" && i < 30; i++) {
		await new Promise((r) => setTimeout(r, 2000));
		action = await api<Action>(`/actions/${prepared.id}`);
	}
	return action;
}
```

After `confirmed`, refetch the bounty. Its status is updated in the same step. If `pending` outlasts the loop, tell the user it is still confirming and **do not offer a retry that could look like a second payment**.

A `confirmed` action can still say it "no longer applied". That means a late signature was recorded on Stellar after the bounty had moved on, so always show `statusMessage` and trust the refetched bounty.

Show `action.statusMessage` to the user. On `failed`, also branch on `failureCode`. Link `explorerUrl` on success.

### Action kinds

| Kind               | Who             | Extra body                                     | When                                  |
| ------------------ | --------------- | ---------------------------------------------- | ------------------------------------- |
| `create`           | Issuer          | none                                           | Publish the complete draft            |
| `fund`             | Issuer          | none                                           | Lock the reward                       |
| `assign`           | Issuer          | `contributor` (optional if saved on the draft) | After funding                         |
| `accept`           | Contributor     | none                                           | After assignment                      |
| `submit`           | Contributor     | `submission`                                   | In progress or revision requested     |
| `request_revision` | Issuer          | `note` (required)                              | During review, up to 3 times          |
| `approve`          | Issuer          | none                                           | During review                         |
| `release`          | Issuer          | none                                           | After approval                        |
| `auto_release`     | Contributor     | none                                           | Review window ended, or work approved |
| `cancel`           | Issuer          | none                                           | Unfunded, or funded and unassigned    |
| `request_cancel`   | Either party    | none                                           | Assigned through review               |
| `withdraw_cancel`  | Requester       | none                                           | While a request is open               |
| `confirm_cancel`   | The other party | none                                           | While a request is open               |
| `reclaim`          | Issuer          | none                                           | After a timeout                       |

`submission` shape:

```json
{
	"deliverableUrl": "https://github.com/acme/site/pull/12",
	"notes": "Up to 2,000 characters",
	"evidenceReference": "Up to 500 characters"
}
```

`deliverableUrl` must be a full `http(s)` link. Any open cancellation request is cleared automatically when a bounty changes status.

Each `reclaim` works the same way for the frontend. Before the recovery date the server co-signs it. After the recovery date the issuer claims directly, and every other action returns `RECOVERY_DATE_PASSED`.

Auto-release normally happens without anyone acting. Show the `auto_release` button to the contributor as "Claim payment", as a fallback.

If `autoReleaseError` is set, show the contributor: "Your automatic payment did not go through. Check that USDC is enabled in your wallet."

## 8. Screens

| PRD screen              | Data                                         | Actions                                                                    |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Dashboard               | `GET /dashboard`                             | Links to bounties                                                          |
| Create bounty           | `POST`/`PATCH /bounties`                     | `create`                                                                   |
| Fund bounty             | Bounty and `GET /stellar/accounts/{address}` | `fund`                                                                     |
| Details and assignment  | `GET /bounties/{reference}`                  | `assign`, `accept`                                                         |
| Submission and review   | `/submissions`                               | `submit`, `approve`, `request_revision`                                    |
| Payout and history      | `/activity`, `/transactions`                 | `release`, `auto_release`                                                  |
| Cancellation and refund | Bounty, `/activity`                          | `cancel`, `request_cancel`, `withdraw_cancel`, `confirm_cancel`, `reclaim` |

Poll `GET /notifications?limit=10` about every 30 seconds for the badge. There are no WebSockets.

## 9. Error codes

### Validation and access

| Code                                                                                             | Status      | UI response                              |
| ------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------- |
| `VALIDATION_FAILED`                                                                              | 400         | Show `fields` beside inputs              |
| `BAD_REQUEST`, `INVALID_JSON`                                                                    | 400         | Show message                             |
| `BOUNTY_INCOMPLETE`                                                                              | 422         | Show `fields` and return to the form     |
| `INVALID_CONTRIBUTOR`                                                                            | 400/409/422 | Highlight the contributor field          |
| `TOO_MANY_DRAFTS`                                                                                | 409         | Ask the user to delete a draft           |
| `WALLET_NOT_CONNECTED`, `SESSION_EXPIRED`, `UNAUTHORIZED`                                        | 401         | Prompt to reconnect                      |
| `NOT_ISSUER`, `NOT_CONTRIBUTOR`, `NOT_PARTY`, `NOT_CANCEL_REQUESTER`, `FORBIDDEN`                | 403/409     | Show message. Check the connected wallet |
| `BOUNTY_NOT_FOUND`, `ACTION_NOT_FOUND`, `NOTIFICATION_NOT_FOUND`, `NOT_FOUND`, `ROUTE_NOT_FOUND` | 404         | Show a not-found state                   |
| `RATE_LIMITED`                                                                                   | 429         | Wait `retryAfterSeconds`                 |
| `PAYLOAD_TOO_LARGE`                                                                              | 413         | Ask for shorter content                  |
| `CONFLICT`                                                                                       | 409         | Refetch and try again                    |
| `UNPROCESSABLE`                                                                                  | 422         | Show message                             |
| `INTERNAL_ERROR`                                                                                 | 500         | Show message and `requestId`             |

### Wallet sign-in

| Code                                          | UI response                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| `CHALLENGE_EXPIRED`, `CHALLENGE_USED`         | Restart sign-in                                            |
| `CHALLENGE_NOT_SIGNED`                        | Usually the wrong wallet network. Ask to switch to Testnet |
| `CHALLENGE_INVALID`, `CHALLENGE_WRONG_ISSUER` | Restart sign-in                                            |
| `INVALID_ADDRESS`                             | Show address error                                         |
| `WALLET_SIGN_IN_UNAVAILABLE`                  | Sign-in is temporarily unavailable                         |

### Bounty rules

| Code                                                     | UI response                                               |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `INVALID_BOUNTY_STATE`, `BOUNTY_CHANGED`                 | Refetch the bounty                                        |
| `BOUNTY_LOCKED`                                          | Terms cannot change after publishing                      |
| `ALREADY_ON_CHAIN`, `DRAFT_NOT_ON_CHAIN`, `NOT_ON_CHAIN` | Refetch the bounty                                        |
| `ALREADY_FUNDED`, `NOT_FUNDED`                           | Refetch and show the right step                           |
| `ALREADY_PAID`                                           | Show the paid state. Never retry                          |
| `NOT_APPROVED`                                           | Approve first                                             |
| `DEADLINE_PASSED`                                        | Offer to cancel and create a new bounty                   |
| `RECOVERY_DATE_PASSED`                                   | Only the issuer can reclaim. Show that action             |
| `REVISION_LIMIT_REACHED`                                 | Offer approve only                                        |
| `REVIEW_WINDOW_OPEN`, `REVIEW_WINDOW_CLOSED`             | Refetch and show the countdown                            |
| `SUBMISSION_WINDOW_CLOSED`, `REVISION_WINDOW_CLOSED`     | Disable submit and show message                           |
| `RECLAIM_NOT_AVAILABLE`                                  | Show when reclaim opens                                   |
| `MUTUAL_CANCEL_REQUIRED`                                 | Offer `request_cancel`                                    |
| `CANCELLATION_ALREADY_OPEN`, `NO_OPEN_CANCELLATION`      | Refetch the bounty                                        |
| `CANNOT_CONFIRM_OWN_CANCELLATION`                        | Show "Waiting for the other party"                        |
| `ESCROW_BALANCE_MISSING`                                 | Stop the flow and show a support contact with `requestId` |

### Funding, wallet, and network

| Code                                                                      | UI response                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `INSUFFICIENT_BALANCE`                                                    | Show `details.required`, `available`, `shortfall`            |
| `TRUSTLINE_MISSING`                                                       | Prompt to enable USDC                                        |
| `RECIPIENT_TRUSTLINE_MISSING`                                             | `details.recipient`, when present, says who must enable USDC |
| `RECIPIENT_NOT_ACTIVE`, `RECIPIENT_LIMIT_REACHED`, `ASSET_NOT_AUTHORIZED` | Show message. The receiving wallet must fix it               |
| `FUNDS_NOT_CLAIMABLE`, `FUNDS_ALREADY_CLAIMED`                            | Refetch the bounty. Never retry a payout                     |
| `ESCROW_LOW_RESERVE`                                                      | Temporary platform issue. Retry later                        |
| `ACCOUNT_NOT_ACTIVE`                                                      | Wallet needs XLM                                             |
| `INSUFFICIENT_XLM`                                                        | Wallet needs XLM for fees                                    |
| `INVALID_TRANSACTION`, `TRANSACTION_MISMATCH`                             | Start the action again                                       |
| `SIGNATURE_MISSING`, `SIGNATURE_REJECTED`                                 | Check the wallet matches the session                         |
| `ACTION_WRONG_WALLET`                                                     | Switch to the wallet that prepared it                        |
| `ACTION_EXPIRED`, `TRANSACTION_EXPIRED`, `TRANSACTION_TOO_EARLY`          | Start the action again                                       |
| `WALLET_SEQUENCE_CHANGED`, `NETWORK_BUSY`                                 | Start the action again                                       |
| `TRANSACTION_IN_PROGRESS`                                                 | Wait, then refetch                                           |
| `TRANSACTION_FAILED`                                                      | Show message. No funds moved                                 |
| `STELLAR_UNAVAILABLE`, `ESCROW_UNAVAILABLE`, `SERVICE_UNAVAILABLE`        | Show a temporary outage and allow retry                      |

## 10. Testing with Testnet wallets

1. Create two wallets in Freighter on **Testnet**, one issuer and one contributor.
2. Fund each with XLM at [Friendbot](https://lab.stellar.org/account/fund).
3. Add the USDC trustline in both wallets.
4. Get test USDC for the issuer from [Circle's faucet](https://faucet.circle.com).
5. Run the full journey, then test a wrong wallet, a rejected signature, and a revision.
