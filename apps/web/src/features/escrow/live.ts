"use client";

/**
 * Live mode: the store's actions backed by the Boluck API and a real Stellar wallet.
 *
 * Every on-chain action runs through `runLive()`:
 *   prepare (`POST /bounties/{ref}/actions`, the server checks the escrow rules and returns an unsigned transaction)
 *   → the wallet signs it (never submits it) → `POST /actions/{id}/submit` → poll while pending → reload the bounty.
 * The server's `availableActions` decide what is allowed; the guards in @repo/stellar/escrow are only pre-checks.
 */
import type { ActionKind, Bounty, TxDetailRow, TxState } from "@repo/stellar/bounty";
import * as escrow from "@repo/stellar/escrow";
import { formatAmount, shortAddress, shortHash } from "@repo/stellar/format";
import { toast } from "@repo/ui/toast";
import { api, ApiError, setToken, setUnauthorizedHandler } from "@/lib/api/client";
import { toBalance, toBounty, toSubmissions, toTransactions } from "@/lib/api/mappers";
import type { ActionDto, PrepareActionDto } from "@/lib/api/types";
import { sleep } from "@/lib/utils";
import { getWalletAddress, getWalletPassphrase, signWithWallet, WalletRejected } from "@/features/wallet/kit";
import { walletName } from "@/features/wallet/wallets";
import { signatureGate, type AppState } from "./store";

type Set = (partial: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
type Get = () => AppState;

const IDLE_TX: TxState = { stage: "idle", title: "" };
const POLL_EVERY = 2500;
const POLL_FOR = 90_000;

const ACTION_LABEL: Record<ActionKind, string> = {
	create: "Publish bounty",
	fund: "Fund bounty",
	assign: "Assign contributor",
	accept: "Accept assignment",
	submit: "Submit work",
	request_revision: "Request a revision",
	approve: "Approve work",
	release: "Release payment",
	cancel: "Cancel bounty",
	request_cancel: "Request cancellation",
	withdraw_cancel: "Withdraw cancellation request",
	confirm_cancel: "Confirm cancellation",
	reclaim: "Reclaim escrow",
	auto_release: "Claim payment",
};

const num = (v: unknown) => (typeof v === "string" || typeof v === "number" ? formatAmount(Number(v)) : undefined);

/**
 * The API's `message` is written for people; a few codes get the extra facts the guide asks for (§9).
 * Branch on `code`, never on the message.
 */
const errorMessage = (e: unknown) => {
	if (!(e instanceof ApiError)) return e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.";
	const d = (e.details ?? {}) as Record<string, unknown>;
	switch (e.code) {
		case "INSUFFICIENT_BALANCE":
			return d.required
				? `${e.message} Needed ${num(d.required)}, available ${num(d.available) ?? "—"}${d.shortfall ? ` (${num(d.shortfall)} short)` : ""}.`
				: e.message;
		case "TRUSTLINE_MISSING":
			return `${e.message} In your wallet, add the USDC asset${typeof d.asset === "string" ? ` (issuer ${shortAddress(d.asset.split(":")[1], 4, 5)})` : ""}.`;
		case "RECIPIENT_TRUSTLINE_MISSING":
			return typeof d.recipient === "string" ? `${e.message} (${shortAddress(d.recipient)} must enable USDC.)` : e.message;
		case "ACCOUNT_NOT_ACTIVE":
		case "INSUFFICIENT_XLM":
			return `${e.message} Get free test XLM from Friendbot (lab.stellar.org/account/fund).`;
		case "CHALLENGE_NOT_SIGNED":
			return "Your wallet didn't sign for Stellar Testnet. Switch it to Testnet and connect again.";
		case "SIGNATURE_MISSING":
		case "SIGNATURE_REJECTED":
		case "ACTION_WRONG_WALLET":
			return `${e.message} Make sure your wallet is on the account you connected with.`;
		case "ESCROW_BALANCE_MISSING":
			return `${e.message} Please contact support${e.requestId ? ` with reference ${e.requestId}` : ""}.`;
	}
	// Validation errors: the per-field messages say exactly what to fix.
	const fields = e.fields?.map((f) => f.message).filter((m) => m !== e.message);
	return fields?.length ? `${e.message} ${fields.join(" ")}` : e.message;
};

const rowsFor = (b: Bounty, extra: TxDetailRow[] = []): TxDetailRow[] => [
	{ label: "Bounty", value: b.id },
	...extra,
	{ label: "Asset", value: "Testnet USDC · Stellar" },
];

interface LiveRun {
	bountyId: string;
	kind: ActionKind;
	payload?: Omit<PrepareActionDto, "kind">;
	summary: string;
	rows: TxDetailRow[];
	/** Client-side pre-check (same rules as the server). */
	guard?: () => escrow.Guard;
	step?: string;
	success: { title: string; description?: string; href?: string };
	/** Keep the dialog open for a following step. */
	chained?: boolean;
}

export function createLiveActions(set: Set, get: Get): Partial<AppState> {
	const find = (id: string) => get().bounties.find((b) => b.id === id);

	/** Remember what the API said about the request: field messages for the form, a cooldown after a 429. */
	const noteError = (e: unknown) => {
		if (!(e instanceof ApiError)) return;
		if (e.status === 429) set({ cooldownUntil: Date.now() + (e.retryAfterSeconds ?? 10) * 1000 });
		if (e.fields?.length) set({ fieldErrors: Object.fromEntries(e.fields.map((f) => [f.field, f.message])) });
		else if (e.code === "INVALID_CONTRIBUTOR") set({ fieldErrors: { contributorAddress: e.message, contributor: e.message } });
	};

	const clearSession = () => {
		setToken(null);
		set({
			wallet: null,
			session: null,
			bounties: [],
			transactions: [],
			notifications: [],
			unread: 0,
			account: null,
			loaded: false,
		});
	};
	setUnauthorizedHandler(() => {
		if (!get().wallet) return;
		clearSession();
		toast.warning("Your wallet session ended", { description: "Connect your wallet again to continue." });
	});

	/** Waits for `promise` unless the person closes the dialog first (then resolves `null`). */
	function cancellable<T>(promise: Promise<T>): Promise<T | null> {
		return new Promise<T | null>((resolve, reject) => {
			let done = false;
			signatureGate.set((signed) => {
				if (!signed && !done) {
					done = true;
					resolve(null);
				}
			});
			promise.then(
				(v) => !done && ((done = true), resolve(v)),
				(e) => !done && ((done = true), reject(e)),
			);
		}).finally(() => signatureGate.set(null));
	}

	async function poll(action: ActionDto): Promise<ActionDto> {
		const until = Date.now() + POLL_FOR;
		let current = action;
		while (current.status === "pending" && Date.now() < until) {
			await sleep(POLL_EVERY);
			current = await api.action(current.id);
		}
		return current;
	}

	async function runLive(opts: LiveRun): Promise<ActionDto | null> {
		const wallet = get().wallet;
		if (!wallet) {
			toast.error("Connect a wallet first", { description: "Every Boluck action is signed in your wallet." });
			return null;
		}
		const b = find(opts.bountyId);
		const title = ACTION_LABEL[opts.kind];
		const wait = Math.ceil((get().cooldownUntil - Date.now()) / 1000);
		if (wait > 0) {
			toast.warning("Too many requests", { description: `Try again in ${wait} seconds.` });
			return null;
		}
		if (get().escrowConfig?.configured === false) {
			toast.error("Payments are temporarily unavailable", { description: "Escrow isn't configured right now. Try again later." });
			return null;
		}
		const rejection = opts.guard?.() ?? null;
		if (rejection) {
			toast.error("The escrow would reject this", { description: rejection });
			return null;
		}
		if (b?.chain && !b.chain.availableActions.includes(opts.kind)) {
			toast.error(`${title} isn't available right now`, {
				description: "The bounty may have changed. It has been refreshed with the latest state.",
			});
			void get().loadBounty(opts.bountyId);
			return null;
		}

		const base: TxState = { stage: "authorize", title, summary: opts.summary, fn: opts.kind, rows: opts.rows, step: opts.step };
		set({ tx: { ...base, waitingFor: "prepare" }, fieldErrors: {} });
		const fail = (error: string) => {
			set({ tx: { ...base, stage: "error", error } });
			return null;
		};

		let prepared: ActionDto | null;
		try {
			prepared = await cancellable(api.prepareAction(opts.bountyId, { kind: opts.kind, ...opts.payload }));
		} catch (e) {
			noteError(e);
			void get().loadBounty(opts.bountyId);
			// Codes with a next step the guide spells out (§9).
			const next =
				e instanceof ApiError
					? e.code === "BOUNTY_INCOMPLETE"
						? { label: "Complete the draft", href: `/bounties/${opts.bountyId}/edit` }
						: e.code === "DEADLINE_PASSED" || e.code === "MUTUAL_CANCEL_REQUIRED"
							? { label: "Cancellation options", href: `/refunds?bounty=${opts.bountyId}` }
							: e.code === "ALREADY_PAID"
								? { label: "View bounty", href: `/bounties/${opts.bountyId}` }
								: undefined
					: undefined;
			if (next) toast.error(`${title} isn't possible`, { description: errorMessage(e), action: next });
			return fail(errorMessage(e));
		}
		if (!prepared) return cancelled(title);
		if (!prepared.transaction) return fail("The server didn't return a transaction to sign.");

		set({ tx: { ...base, waitingFor: "wallet" } });
		// Actions must be signed by the session's wallet: if the person switched accounts, sign in again.
		const current = await getWalletAddress(wallet.provider).catch(() => wallet.address);
		if (current !== wallet.address) {
			set({ tx: IDLE_TX });
			clearSession();
			toast.warning("Your wallet switched accounts", {
				description: `Connect again with ${shortAddress(current)} to continue. Nothing was signed.`,
			});
			return null;
		}
		let signed: string | null;
		try {
			signed = await cancellable(
				signWithWallet(wallet.provider, prepared.transaction, prepared.networkPassphrase, wallet.address),
			);
		} catch (e) {
			if (e instanceof WalletRejected) return cancelled(title);
			return fail(`${walletName(wallet.provider)}: ${errorMessage(e)}`);
		}
		if (!signed) return cancelled(title);

		set({ tx: { ...base, stage: "pending", hash: prepared.hash } });
		let result: ActionDto;
		try {
			result = await poll(await api.submitAction(prepared.id, signed));
		} catch (e) {
			noteError(e);
			void get().loadBounty(opts.bountyId);
			return fail(errorMessage(e));
		}

		if (result.status !== "confirmed") {
			void get().loadBounty(opts.bountyId);
			// Still pending: don't offer anything that could look like paying twice.
			const error =
				result.status === "pending"
					? "Still confirming on Stellar. Check back in a minute — don't sign it again; it can only apply once."
					: result.status === "expired"
						? "This request expired before it was signed. Start the action again."
						: `${result.statusMessage}${result.failureCode ? ` (${result.failureCode})` : ""}`;
			fail(error);
			toast.error(`${title} didn't go through`, { description: error });
			return null;
		}

		await get().loadBounty(opts.bountyId);
		void get().refresh();
		set({ tx: { ...base, stage: "success", hash: result.hash, explorerUrl: result.explorerUrl ?? undefined } });
		// A late signature can confirm after the bounty moved on ("no longer applied"): say what really happened.
		const stale = /no longer/i.test(result.statusMessage);
		(stale ? toast.info : toast.success)(stale ? title : opts.success.title, {
			// The server's statusMessage says what actually happened (guide §7).
			description: result.statusMessage || opts.success.description,
			meta: `tx ${shortHash(result.hash)}`,
			action: opts.success.href ? { label: "View", href: opts.success.href } : undefined,
		});
		await sleep(opts.chained ? 900 : 700);
		if (!opts.chained && get().tx.hash === result.hash) set({ tx: IDLE_TX });
		return result;
	}

	function cancelled(title: string) {
		set({ tx: IDLE_TX });
		toast.warning("Request rejected in your wallet", { description: `${title}: nothing was signed and nothing changed.` });
		return null;
	}

	const closeAfterChain = () => set({ tx: IDLE_TX });

	/** Run a simple one-signature action. */
	const single = async (opts: LiveRun) => !!(await runLive(opts));

	return {
		confirmTx: () => {},
		clearFieldErrors: () => set({ fieldErrors: {} }),
		rejectTx: () => {
			signatureGate.set(null);
			set({ tx: IDLE_TX });
		},
		closeTx: () => set({ tx: IDLE_TX }),
		resetDemo: () => {},
		setSimulateFailures: () => {},

		connect: async (provider, role) => {
			try {
				const address = await getWalletAddress(provider);
				const network = get().network ?? (await api.network());
				set({ network });
				const walletPassphrase = await getWalletPassphrase(provider);
				if (walletPassphrase && walletPassphrase !== network.networkPassphrase) {
					toast.error(`Switch ${walletName(provider)} to Testnet`, {
						description: "Your wallet is on a different Stellar network. Boluck runs on Stellar Testnet.",
					});
					return false;
				}
				if (Date.now() < get().cooldownUntil) throw new ApiError("Too many sign-in attempts. Wait a moment and try again.", 429);
				const challenge = await api.challenge(address);
				const signed = await signWithWallet(provider, challenge.transaction, challenge.networkPassphrase, address);
				const session = await api.verify(signed);
				setToken(session.walletToken);
				set({
					wallet: { provider, address: session.address },
					session: { token: session.walletToken, expiresAt: session.expiresAt },
					role,
					loaded: false,
				});
				toast.success(`Connected with ${walletName(provider)}`, {
					description: `${session.shortAddress} on Stellar Testnet`,
				});
				void get().refresh();
				return true;
			} catch (e) {
				noteError(e);
				if (e instanceof WalletRejected) {
					toast.warning("Connection cancelled", { description: `Nothing was signed in ${walletName(provider)}.` });
				} else {
					toast.error(`Couldn't connect ${walletName(provider)}`, { description: errorMessage(e) });
				}
				return false;
			}
		},

		disconnect: () => {
			void api.logout().catch(() => {});
			clearSession();
			toast.info("Wallet disconnected", { description: "Connect again any time to pick up where you left off." });
		},

		// One wallet plays both roles; the toggle only changes the view.
		setRole: (role) => set({ role }),

		refresh: async () => {
			const wallet = get().wallet;
			if (!wallet) return;
			try {
				const [bounties, transactions, notifications, account, config, network, dashboard] = await Promise.all([
					api.bounties(),
					api.transactions(),
					api.notifications({ limit: 10 }),
					api.account(wallet.address).catch(() => null),
					get().escrowConfig ? Promise.resolve(get().escrowConfig!) : api.escrowConfig().catch(() => null),
					get().network ? Promise.resolve(get().network!) : api.network().catch(() => null),
					api.dashboard().catch(() => null),
				]);
				if (get().wallet?.address !== wallet.address) return;
				const previous = new Map(get().bounties.map((b) => [b.id, b]));
				const usdc = account?.assets.find((a) => a.code === "USDC" && !a.native);
				set({
					bounties: bounties.result.map((dto) => toBounty(dto, previous.get(dto.reference)?.submissions)),
					transactions: toTransactions(transactions.result),
					notifications: notifications.result.map((n) => ({
						id: n.id,
						bountyId: n.reference,
						title: n.title,
						read: n.read,
						at: n.at,
					})),
					unread: notifications.unread,
					more: {
						transactions: transactions.paginationMeta.nextPage,
						notifications: notifications.paginationMeta.nextPage,
					},
					balances: account ? { [wallet.address]: toBalance(account) } : get().balances,
					account: account ? { exists: account.exists, usdcTrusted: !!usdc?.trusted } : get().account,
					escrowConfig: config,
					network,
					dashboard,
					loaded: true,
				});
			} catch (e) {
				set({ loaded: true });
				if (!(e instanceof ApiError && e.status === 401))
					toast.error("Couldn't load your bounties", { description: errorMessage(e) });
			}
		},

		loadBounty: async (id) => {
			if (!get().wallet) return;
			set((s) => ({ fetching: { ...s.fetching, [id]: true } }));
			try {
				const [dto, submissions, activity] = await Promise.all([api.bounty(id), api.submissions(id), api.activity(id)]);
				const bounty = toBounty(dto, toSubmissions(submissions, dto.status));
				const events = toTransactions(activity);
				const ids = new Set(events.map((t) => t.id));
				set((s) => ({
					bounties: s.bounties.some((b) => b.id === id)
						? s.bounties.map((b) => (b.id === id ? bounty : b))
						: [bounty, ...s.bounties],
					transactions: [...events, ...s.transactions.filter((t) => !ids.has(t.id))].sort((a, b) =>
						b.timestamp.localeCompare(a.timestamp),
					),
				}));
			} catch (e) {
				// 404 = not this wallet's bounty; the page shows "not found".
				if (e instanceof ApiError && e.status === 404) set((s) => ({ bounties: s.bounties.filter((b) => b.id !== id) }));
			} finally {
				set((s) => ({ fetching: Object.fromEntries(Object.entries(s.fetching).filter(([key]) => key !== id)) }));
			}
		},

		loadMoreTransactions: async () => {
			try {
				const page = await api.transactions({ offset: get().transactions.length });
				const fresh = toTransactions(page.result);
				const ids = new Set(get().transactions.map((t) => t.id));
				set((s) => ({
					transactions: [...s.transactions, ...fresh.filter((t) => !ids.has(t.id))],
					more: { ...s.more, transactions: page.paginationMeta.nextPage },
				}));
			} catch (e) {
				toast.error("Couldn't load more history", { description: errorMessage(e) });
			}
		},

		loadMoreNotifications: async () => {
			try {
				const page = await api.notifications({ offset: get().notifications.length });
				set((s) => ({
					notifications: [
						...s.notifications,
						...page.result.map((n) => ({ id: n.id, bountyId: n.reference, title: n.title, read: n.read, at: n.at })),
					],
					more: { ...s.more, notifications: page.paginationMeta.nextPage },
				}));
			} catch (e) {
				toast.error("Couldn't load more updates", { description: errorMessage(e) });
			}
		},

		updateDraft: async (id, input) => {
			set({ fieldErrors: {} });
			try {
				const dto = await api.updateDraft(id, {
					title: input.title,
					description: input.description,
					requirements: input.requirements.join("\n"),
					acceptanceCriteria: input.acceptanceCriteria.join("\n"),
					rewardAmount: input.rewardText ?? input.rewardAmount.toFixed(2),
					deadline: input.deadline,
					// Empty clears a previously named contributor.
					contributorAddress: input.contributor ?? "",
				});
				set((s) => ({ bounties: s.bounties.map((b) => (b.id === id ? toBounty(dto, b.submissions) : b)) }));
				toast.success("Draft updated");
				return true;
			} catch (e) {
				noteError(e);
				toast.error("Couldn't update the draft", { description: errorMessage(e) });
				return false;
			}
		},

		deleteDraft: async (id) => {
			try {
				await api.deleteDraft(id);
				set((s) => ({ bounties: s.bounties.filter((b) => b.id !== id) }));
				toast.success("Draft deleted", { description: `${id} was never on Stellar, so nothing else changes.` });
				return true;
			} catch (e) {
				toast.error("Couldn't delete the draft", { description: errorMessage(e) });
				return false;
			}
		},

		markNotificationsRead: async () => {
			if (!get().unread) return;
			set((s) => ({ unread: 0, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
			await api.readAllNotifications().catch(() => {});
		},

		createBounty: async (input) => {
			if (!get().wallet) {
				toast.error("Connect a wallet first");
				return null;
			}
			const rejection = escrow.validateReward(input.rewardAmount);
			if (rejection) {
				toast.error("Check the reward", { description: rejection });
				return null;
			}
			set({ fieldErrors: {} });
			try {
				const dto = await api.createDraft({
					title: input.title,
					description: input.description,
					requirements: input.requirements.join("\n"),
					acceptanceCriteria: input.acceptanceCriteria.join("\n"),
					rewardAmount: input.rewardText ?? input.rewardAmount.toFixed(2),
					deadline: input.deadline,
					...(input.contributor ? { contributorAddress: input.contributor } : {}),
				});
				set((s) => ({ bounties: [toBounty(dto), ...s.bounties] }));
				toast.success("Draft saved", { description: `${dto.reference} · next, publish it and lock the reward in escrow.` });
				return dto.reference;
			} catch (e) {
				noteError(e);
				toast.error("Couldn't save the bounty", { description: errorMessage(e) });
				return null;
			}
		},

		/** Publish (if still a draft off-chain) → fund → assign the named contributor: one signature each. */
		fundBounty: async (id) => {
			const b = find(id);
			if (!b) return false;
			const caller = get().wallet?.address;
			const needsPublish = !!b.chain?.availableActions.includes("create");
			const steps = [needsPublish && "create", "fund", b.contributor && "assign"].filter(Boolean) as ActionKind[];
			const stepOf = (k: ActionKind) => (steps.length > 1 ? `Step ${steps.indexOf(k) + 1} of ${steps.length}` : undefined);

			if (needsPublish) {
				const ok = await runLive({
					bountyId: id,
					kind: "create",
					summary: `Register ${id} on Stellar before funding`,
					rows: rowsFor(b, [
						{ label: "Reward", value: formatAmount(b.rewardAmount) },
						{ label: "Deadline", value: new Date(b.deadline).toUTCString().slice(5, 16) },
					]),
					step: stepOf("create"),
					chained: true,
					success: { title: "Bounty published", description: "Next, lock the reward in escrow." },
				});
				if (!ok) return false;
			}

			const funded = await runLive({
				bountyId: id,
				kind: "fund",
				summary: `Lock ${formatAmount(b.rewardAmount)} in escrow`,
				rows: rowsFor(b, [
					{ label: "Amount", value: formatAmount(b.rewardAmount) },
					{ label: "Funding wallet", value: shortAddress(caller) },
				]),
				guard: () => escrow.canFund({ ...find(id)!, status: "draft" }, caller, caller ? get().balances[caller] : undefined),
				step: stepOf("fund"),
				chained: !!b.contributor,
				success: { title: "Funding confirmed", description: `${formatAmount(b.rewardAmount)} is now locked in escrow.` },
			});
			if (!funded) return false;

			if (b.contributor && find(id)?.chain?.availableActions.includes("assign")) {
				await runLive({
					bountyId: id,
					kind: "assign",
					payload: { contributor: b.contributor },
					summary: `Assign ${shortAddress(b.contributor)} to ${id}`,
					rows: rowsFor(b, [{ label: "Contributor", value: shortAddress(b.contributor) }]),
					step: stepOf("assign"),
					success: { title: "Contributor assigned", description: "They can now accept the assignment." },
				});
			}
			closeAfterChain();
			return true;
		},

		assignContributor: async (id, contributor) => {
			const b = find(id);
			if (!b) return false;
			const caller = get().wallet?.address;
			return single({
				bountyId: id,
				kind: "assign",
				payload: { contributor },
				summary: `Assign ${shortAddress(contributor)} to ${id}`,
				rows: rowsFor(b, [{ label: "Contributor", value: shortAddress(contributor) }]),
				guard: () => escrow.canAssign({ ...find(id)!, contributor: undefined }, caller, contributor),
				success: { title: "Contributor assigned", description: "They can now accept the assignment." },
			});
		},

		acceptAssignment: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "accept",
				summary: `Start work on ${id}`,
				rows: rowsFor(b, [
					{ label: "Reward", value: formatAmount(b.rewardAmount) },
					{ label: "In escrow", value: formatAmount(b.escrowBalance) },
				]),
				guard: () => escrow.canAccept(find(id)!, get().wallet?.address),
				success: { title: "Assignment accepted", description: "Status moved to In progress." },
			});
		},

		submitWork: async (id, input) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "submit",
				payload: {
					submission: {
						deliverableUrl: input.deliverableUrl,
						notes: input.notes || undefined,
						evidenceReference: input.evidence || undefined,
					},
				},
				summary: "Record your deliverable on Stellar",
				rows: rowsFor(b, [{ label: "Deliverable", value: input.deliverableUrl.replace(/^https?:\/\//, "") }]),
				guard: () => escrow.canSubmit(find(id)!, get().wallet?.address),
				success: { title: "Work submitted", description: "The issuer has been notified." },
			});
		},

		requestRevision: async (id, comment) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "request_revision",
				payload: { note: comment },
				summary: "Return the bounty for another submission",
				rows: rowsFor(b, [{ label: "Escrow", value: `${formatAmount(b.escrowBalance)} stays locked` }]),
				guard: () => escrow.canReview(find(id)!, get().wallet?.address),
				success: { title: "Revision requested", description: "The contributor can update and resubmit." },
			});
		},

		/** Two signatures: approve the work, then release the payment. */
		approveAndRelease: async (id) => {
			const b = find(id);
			if (!b) return false;
			const approved = await runLive({
				bountyId: id,
				kind: "approve",
				summary: "Accept the submitted work",
				rows: rowsFor(b, [{ label: "Contributor", value: shortAddress(b.contributor) }]),
				guard: () => escrow.canReview(find(id)!, get().wallet?.address),
				step: "Step 1 of 2",
				chained: true,
				success: { title: "Work approved", description: "Next, release the reward." },
			});
			if (!approved) return false;
			const released = await runLive({
				bountyId: id,
				kind: "release",
				summary: `Release ${formatAmount(b.rewardAmount)} to the contributor`,
				rows: rowsFor(b, [
					{ label: "Amount", value: formatAmount(b.rewardAmount) },
					{ label: "Recipient", value: shortAddress(b.contributor) },
				]),
				step: "Step 2 of 2",
				success: {
					title: "Reward released",
					description: `${formatAmount(b.rewardAmount)} sent to the contributor.`,
					href: "/history",
				},
			});
			if (!released) closeAfterChain();
			// Approved even if the release was declined: the bounty page offers "Release" next.
			return true;
		},

		releasePayment: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "release",
				summary: `Release ${formatAmount(b.rewardAmount)} to the contributor`,
				rows: rowsFor(b, [
					{ label: "Amount", value: formatAmount(b.rewardAmount) },
					{ label: "Recipient", value: shortAddress(b.contributor) },
				]),
				guard: () => escrow.canRelease(find(id)!, get().wallet?.address),
				success: { title: "Reward released", href: "/history" },
			});
		},

		/** Unfunded, or funded but not yet assigned: the issuer cancels alone. */
		cancelBounty: async (id) => {
			const b = find(id);
			if (!b) return false;
			const refund = b.escrowBalance;
			return single({
				bountyId: id,
				kind: "cancel",
				summary: refund ? `Return ${formatAmount(refund)} to your wallet` : `Cancel ${id}`,
				rows: rowsFor(b, [{ label: "Refund", value: formatAmount(refund) }]),
				success: refund
					? { title: "Refund confirmed", description: `${formatAmount(refund)} returned to your wallet.`, href: "/history" }
					: { title: "Bounty cancelled" },
			});
		},

		requestCancel: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "request_cancel",
				summary: "Ask the other party to agree to cancel",
				rows: rowsFor(b, [{ label: "Refund if agreed", value: `${formatAmount(b.escrowBalance)} to the issuer` }]),
				success: { title: "Cancellation requested", description: "Nothing moves until the other party confirms." },
			});
		},

		withdrawCancel: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "withdraw_cancel",
				summary: "Keep the bounty going",
				rows: rowsFor(b),
				success: { title: "Cancellation request withdrawn" },
			});
		},

		confirmCancel: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "confirm_cancel",
				summary: `Agree to cancel and refund ${formatAmount(b.escrowBalance)} to the issuer`,
				rows: rowsFor(b, [{ label: "Refund", value: `${formatAmount(b.escrowBalance)} to ${shortAddress(b.issuer)}` }]),
				success: { title: "Bounty cancelled", description: "The escrow was refunded to the issuer.", href: "/history" },
			});
		},

		claimPayment: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "auto_release",
				summary: `Collect ${formatAmount(b.rewardAmount)} from escrow`,
				rows: rowsFor(b, [{ label: "Amount", value: formatAmount(b.rewardAmount) }]),
				success: {
					title: "Payment received",
					description: `${formatAmount(b.rewardAmount)} is in your wallet.`,
					href: "/history",
				},
			});
		},

		reclaim: async (id) => {
			const b = find(id);
			if (!b) return false;
			return single({
				bountyId: id,
				kind: "reclaim",
				summary: `Return ${formatAmount(b.escrowBalance)} to your wallet`,
				rows: rowsFor(b, [{ label: "Refund", value: formatAmount(b.escrowBalance) }]),
				success: {
					title: "Escrow reclaimed",
					description: `${formatAmount(b.escrowBalance)} returned to your wallet.`,
					href: "/history",
				},
			});
		},
	};
}

/** After a reload: restore the wallet session if it's still valid, then load everything. */
export async function onLiveRehydrate(set: Set, get: Get) {
	const { session, wallet } = get();
	if (!session || !wallet) {
		set({ loaded: true });
		return;
	}
	if (new Date(session.expiresAt).getTime() <= Date.now()) {
		set({ wallet: null, session: null, loaded: true });
		return;
	}
	setToken(session.token);
	try {
		const current = await api.session();
		if (current.address !== wallet.address) throw new Error("Session belongs to another wallet");
		await get().refresh();
	} catch {
		setToken(null);
		set({ wallet: null, session: null, loaded: true });
	}
}
