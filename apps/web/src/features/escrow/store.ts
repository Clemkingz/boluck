"use client";

/**
 * Client-side app store. Stands in for three things that don't exist yet:
 *  - the wallet connection (Freighter / xBull / Albedo via a wallet kit)
 *  - the escrow smart contract (rules live in lib/escrow.ts)
 *  - the metadata/indexer backend (bounties, submissions, transactions)
 *
 * State is persisted to localStorage so a demo survives reloads. Hydration is
 * skipped on the server and triggered from <StoreHydrator /> so the first
 * client render matches the server-rendered seed data.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { txReference } from "@repo/stellar/network";
import { walletName } from "@/features/wallet/wallets";
import * as escrow from "@repo/stellar/escrow";
import { formatAmount, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES, DEMO_ACCOUNTS, SEED_BALANCES, SEED_BOUNTIES, SEED_TRANSACTIONS } from "@/lib/api/mock-data";
import type {
	Balance,
	Bounty,
	BountyIcon,
	Role,
	Transaction,
	TxDetailRow,
	TxState,
	TxType,
	WalletId,
} from "@repo/stellar/bounty";
import { mockTxHash } from "@repo/stellar/address";
import { sleep } from "@/lib/utils";
import { toast } from "@repo/ui/toast";

export interface CreateBountyInput {
	title: string;
	project: string;
	description: string;
	rewardAmount: number;
	deadline: string;
	requirements: string[];
	acceptanceCriteria: string[];
	contributor?: string;
}

export interface SubmitWorkInput {
	deliverableUrl: string;
	notes: string;
	evidence: string;
}

interface Wallet {
	address: string;
	provider: WalletId;
}

type TxDraft = { type: TxType; amount?: number; to?: string };

interface RunOptions {
	bountyId: string;
	title: string;
	summary: string;
	fn: string;
	rows: TxDetailRow[];
	guard: () => escrow.Guard;
	txs: TxDraft[];
	apply: (state: AppState, now: string) => Partial<AppState>;
	success: { title: string; description?: string; href?: string };
}

interface AppState {
	hydrated: boolean;
	wallet: Wallet | null;
	role: Role;
	bounties: Bounty[];
	transactions: Transaction[];
	balances: Record<string, Balance>;
	simulateFailures: boolean;
	tx: TxState;

	connect: (provider: WalletId, role: Role) => void;
	disconnect: () => void;
	setRole: (role: Role) => void;
	setSimulateFailures: (value: boolean) => void;
	confirmTx: () => void;
	rejectTx: () => void;
	closeTx: () => void;
	resetDemo: () => void;

	createBounty: (input: CreateBountyInput) => Promise<string | null>;
	fundBounty: (id: string) => Promise<boolean>;
	assignContributor: (id: string, contributor: string) => Promise<boolean>;
	claimBounty: (id: string) => Promise<boolean>;
	acceptAssignment: (id: string) => Promise<boolean>;
	submitWork: (id: string, input: SubmitWorkInput) => Promise<boolean>;
	requestRevision: (id: string, comment: string) => Promise<boolean>;
	approveAndRelease: (id: string, comment?: string) => Promise<boolean>;
	releasePayment: (id: string) => Promise<boolean>;
	cancelBounty: (id: string, reason: string, contributorAgreed: boolean) => Promise<boolean>;
}

const IDLE_TX: TxState = { stage: "idle", title: "" };
const CONFIRM_DELAY = 1600;

const seed = () => ({ bounties: SEED_BOUNTIES, transactions: SEED_TRANSACTIONS, balances: SEED_BALANCES });

const mapBounty = (bounties: Bounty[], id: string, fn: (b: Bounty) => Bounty) => bounties.map((b) => (b.id === id ? fn(b) : b));

const credit = (balances: Record<string, Balance>, address: string, delta: number) => {
	const current = balances[address] ?? { usdc: 0, xlm: 0 };
	return { ...balances, [address]: { ...current, usdc: +(current.usdc + delta).toFixed(7) } };
};

const ICONS: BountyIcon[] = ["layout", "code", "sparkle", "doc", "shield", "palette"];

/** Resolves the pending wallet confirmation (true = signed, false = rejected). */
let pendingSignature: ((signed: boolean) => void) | null = null;
let ledgerCursor = 1_292_545;

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => {
			const find = (id: string) => get().bounties.find((b) => b.id === id);

			/** Simulates: wallet confirmation → submit → ledger confirmation. */
			async function run(opts: RunOptions): Promise<string | null> {
				const caller = get().wallet?.address;
				if (!caller) {
					toast.error("Connect a wallet first", { description: "Every Boluck action is signed in your wallet." });
					return null;
				}
				const rejection = opts.guard();
				if (rejection) {
					toast.error("The contract would reject this", { description: rejection });
					return null;
				}

				set({ tx: { stage: "authorize", title: opts.title, summary: opts.summary, fn: opts.fn, rows: opts.rows } });
				const signed = await new Promise<boolean>((resolve) => (pendingSignature = resolve));
				pendingSignature = null;
				if (!signed) {
					set({ tx: IDLE_TX });
					toast.warning("Request rejected in your wallet", { description: "Nothing was signed and nothing changed." });
					return null;
				}

				set((s) => ({ tx: { ...s.tx, stage: "pending" } }));
				await sleep(CONFIRM_DELAY);

				const now = new Date().toISOString();
				const hash = mockTxHash();
				const failed = get().simulateFailures;
				const records: Transaction[] = opts.txs.map((t, i) => ({
					...t,
					hash: i === opts.txs.length - 1 ? hash : mockTxHash(),
					bountyId: opts.bountyId,
					from: caller,
					ledger: (ledgerCursor += 3),
					timestamp: now,
					status: failed ? "failed" : "success",
				}));

				if (failed) {
					// Failed token transfers must not change contract state (PRD rule 9).
					const error = "The token transfer failed. No funds moved and the bounty status is unchanged.";
					set((s) => ({ transactions: [records.at(-1)!, ...s.transactions], tx: { ...s.tx, stage: "error", hash, error } }));
					toast.error(`${opts.title} failed`, { description: error, meta: txReference(records.at(-1)!) });
					return null;
				}

				set((s) => ({
					...opts.apply(s, now),
					transactions: [...records.reverse(), ...s.transactions],
					tx: { ...s.tx, stage: "success", hash },
				}));
				toast.success(opts.success.title, {
					description: opts.success.description,
					meta: txReference({ type: opts.txs.at(-1)!.type, bountyId: opts.bountyId, hash }),
					action: opts.success.href ? { label: "View", href: opts.success.href } : undefined,
				});
				// Let the success state register before the dialog closes.
				await sleep(700);
				if (get().tx.hash === hash) set({ tx: IDLE_TX });
				return hash;
			}

			const walletRows = (b: Bounty, extra: TxDetailRow[] = []): TxDetailRow[] => [
				{ label: "Bounty", value: `${b.id} · ${b.project}` },
				...extra,
				{ label: "Reward token", value: "Testnet USDC · Stellar" },
			];

			return {
				hydrated: false,
				wallet: null,
				role: "issuer",
				...seed(),
				simulateFailures: false,
				tx: IDLE_TX,

				connect: (provider, role) => {
					const account = DEMO_ACCOUNTS[role];
					set({ wallet: { provider, address: account.address }, role });
					toast.success(`Connected with ${walletName(provider)}`, {
						description: `${account.name} · ${shortAddress(account.address)} on Stellar Testnet`,
					});
				},
				disconnect: () => {
					set({ wallet: null });
					toast.info("Wallet disconnected", { description: "Connect again any time to pick up where you left off." });
				},
				setRole: (role) => {
					const { wallet, role: current } = get();
					if (role === current) return;
					const account = DEMO_ACCOUNTS[role];
					set({ role, wallet: wallet ? { ...wallet, address: account.address } : wallet });
					if (wallet)
						toast.info(`Switched to the ${role} view`, {
							description: `Demo wallet: ${account.name} · ${shortAddress(account.address)}`,
						});
				},
				setSimulateFailures: (simulateFailures) => {
					set({ simulateFailures });
					if (simulateFailures)
						toast.warning("Failure simulation on", { description: "Every transaction will fail at the token transfer step." });
					else toast.success("Failure simulation off");
				},
				confirmTx: () => pendingSignature?.(true),
				rejectTx: () => pendingSignature?.(false),
				closeTx: () => {
					pendingSignature?.(false);
					set({ tx: IDLE_TX });
				},
				resetDemo: () => {
					set({ ...seed(), tx: IDLE_TX });
					toast.success("Demo data restored", { description: "Bounties, balances and history are back to the seed state." });
				},

				createBounty: async (input) => {
					const caller = get().wallet?.address;
					const existing = get().bounties.map((b) => Number(b.id.split("-")[1]) || 0);
					const id = `BOL-${String(Math.max(0, ...existing) + 1).padStart(4, "0")}`;
					const hash = await run({
						bountyId: id,
						title: "Create bounty",
						summary: `Register ${id} with the escrow contract`,
						fn: "create_bounty",
						rows: [
							{ label: "Bounty", value: `${id} · ${input.project}` },
							{ label: "Reward", value: formatAmount(input.rewardAmount) },
							{ label: "Contributor", value: input.contributor ? shortAddress(input.contributor) : "Open" },
						],
						guard: () => escrow.validateReward(input.rewardAmount),
						txs: [{ type: "create" }],
						apply: (s, now) => ({
							bounties: [
								{
									...input,
									id,
									icon: ICONS[existing.length % ICONS.length],
									token: "USDC",
									escrowBalance: 0,
									issuer: caller!,
									issuerName: ACCOUNT_NAMES[caller!] ?? "You",
									contributor: input.contributor || undefined,
									status: "draft",
									createdAt: now,
									updatedAt: now,
									submissions: [],
								},
								...s.bounties,
							],
						}),
						success: { title: "Bounty created", description: "Next, secure the reward in escrow." },
					});
					return hash ? id : null;
				},

				fundBounty: async (id) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Fund bounty",
						summary: `Lock ${formatAmount(b.rewardAmount)} in escrow`,
						fn: "fund_bounty",
						rows: walletRows(b, [
							{ label: "Amount", value: formatAmount(b.rewardAmount) },
							{ label: "Funding wallet", value: shortAddress(caller) },
							{ label: "Contributor", value: b.contributor ? shortAddress(b.contributor) : "Open" },
						]),
						guard: () => escrow.canFund(find(id)!, caller, caller ? get().balances[caller] : undefined),
						txs: b.contributor
							? [
									{ type: "assign", to: b.contributor },
									{ type: "fund", amount: b.rewardAmount },
								]
							: [{ type: "fund", amount: b.rewardAmount }],
						apply: (s, now) => ({
							balances: credit(s.balances, caller!, -b.rewardAmount),
							bounties: mapBounty(s.bounties, id, (x) => ({
								...x,
								escrowBalance: x.rewardAmount,
								status: x.contributor ? "assigned" : "funded",
								updatedAt: now,
							})),
						}),
						success: { title: "Funding confirmed", description: `${formatAmount(b.rewardAmount)} is now locked in escrow.` },
					});
					return !!hash;
				},

				assignContributor: async (id, contributor) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Assign contributor",
						summary: `Assign ${shortAddress(contributor)} to ${b.id}`,
						fn: "assign_contributor",
						rows: walletRows(b, [{ label: "Contributor", value: shortAddress(contributor) }]),
						guard: () => escrow.canAssign(find(id)!, caller, contributor),
						txs: [{ type: "assign", to: contributor }],
						apply: (s, now) => ({
							bounties: mapBounty(s.bounties, id, (x) => ({ ...x, contributor, status: "assigned", updatedAt: now })),
						}),
						success: { title: "Contributor assigned", description: "They can now accept the assignment." },
					});
					return !!hash;
				},

				claimBounty: async (id) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Accept bounty",
						summary: `Take on ${b.id} · ${formatAmount(b.rewardAmount)} reserved`,
						fn: "claim_bounty",
						rows: walletRows(b, [
							{ label: "Reward", value: formatAmount(b.rewardAmount) },
							{ label: "Contributor", value: shortAddress(caller) },
						]),
						guard: () => escrow.canClaim(find(id)!, caller),
						txs: [{ type: "assign", to: caller }, { type: "accept" }],
						apply: (s, now) => ({
							bounties: mapBounty(s.bounties, id, (x) => ({ ...x, contributor: caller, status: "in_progress", updatedAt: now })),
						}),
						success: { title: "Bounty accepted", description: "The reward is secured. Submit your work when it's ready." },
					});
					return !!hash;
				},

				acceptAssignment: async (id) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Accept assignment",
						summary: `Start work on ${b.id}`,
						fn: "accept_assignment",
						rows: walletRows(b, [
							{ label: "Reward", value: formatAmount(b.rewardAmount) },
							{ label: "Escrow", value: formatAmount(b.escrowBalance) },
						]),
						guard: () => escrow.canAccept(find(id)!, caller),
						txs: [{ type: "accept" }],
						apply: (s, now) => ({
							bounties: mapBounty(s.bounties, id, (x) => ({ ...x, status: "in_progress", updatedAt: now })),
						}),
						success: { title: "Assignment accepted", description: "Status moved to In progress." },
					});
					return !!hash;
				},

				submitWork: async (id, input) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Submit work",
						summary: `Send your deliverable to ${b.issuerName}`,
						fn: "submit_work",
						rows: walletRows(b, [{ label: "Deliverable", value: input.deliverableUrl.replace(/^https?:\/\//, "") }]),
						guard: () => escrow.canSubmit(find(id)!, caller),
						txs: [{ type: "submit" }],
						apply: (s, now) => ({
							bounties: mapBounty(s.bounties, id, (x) => ({
								...x,
								status: "submitted",
								updatedAt: now,
								submissions: [...x.submissions, { ...input, id: `SUB-${x.submissions.length + 1}`, submittedAt: now }],
							})),
						}),
						success: { title: "Work submitted", description: `${b.issuerName} has been notified.` },
					});
					return !!hash;
				},

				requestRevision: async (id, comment) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Request a revision",
						summary: "Return the bounty for another submission",
						fn: "request_revision",
						rows: walletRows(b, [{ label: "Escrow", value: `${formatAmount(b.escrowBalance)} stays locked` }]),
						guard: () => escrow.canReview(find(id)!, caller),
						txs: [{ type: "request_revision" }],
						apply: (s, now) => ({
							bounties: mapBounty(s.bounties, id, (x) => ({
								...x,
								status: "revision_requested",
								updatedAt: now,
								submissions: x.submissions.map((sub, i) =>
									i === x.submissions.length - 1
										? { ...sub, review: { decision: "revision_requested", comment, reviewedAt: now } }
										: sub,
								),
							})),
						}),
						success: { title: "Revision requested", description: "The contributor can update and resubmit." },
					});
					return !!hash;
				},

				approveAndRelease: async (id, comment = "") => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Approve and release",
						summary: `Release ${formatAmount(b.rewardAmount)} to the contributor`,
						fn: "approve_and_release",
						rows: walletRows(b, [
							{ label: "Amount", value: formatAmount(b.rewardAmount) },
							{ label: "Recipient", value: shortAddress(b.contributor) },
						]),
						guard: () => escrow.canReview(find(id)!, caller),
						txs: [{ type: "approve" }, { type: "payout", amount: b.rewardAmount, to: b.contributor }],
						apply: (s, now) => ({
							balances: credit(s.balances, b.contributor!, b.rewardAmount),
							bounties: mapBounty(s.bounties, id, (x) => ({
								...x,
								escrowBalance: 0,
								status: "paid",
								updatedAt: now,
								submissions: x.submissions.map((sub, i) =>
									i === x.submissions.length - 1 ? { ...sub, review: { decision: "approved", comment, reviewedAt: now } } : sub,
								),
							})),
						}),
						success: {
							title: "Reward released",
							description: `${formatAmount(b.rewardAmount)} sent to ${ACCOUNT_NAMES[b.contributor ?? ""] ?? "the contributor"}.`,
							href: "/history",
						},
					});
					return !!hash;
				},

				releasePayment: async (id) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const hash = await run({
						bountyId: id,
						title: "Release payment",
						summary: `Release ${formatAmount(b.rewardAmount)} to the contributor`,
						fn: "release_payment",
						rows: walletRows(b, [
							{ label: "Amount", value: formatAmount(b.rewardAmount) },
							{ label: "Recipient", value: shortAddress(b.contributor) },
						]),
						guard: () => escrow.canRelease(find(id)!, caller),
						txs: [{ type: "payout", amount: b.rewardAmount, to: b.contributor }],
						apply: (s, now) => ({
							balances: credit(s.balances, b.contributor!, b.rewardAmount),
							bounties: mapBounty(s.bounties, id, (x) => ({ ...x, escrowBalance: 0, status: "paid", updatedAt: now })),
						}),
						success: { title: "Reward released", href: "/history" },
					});
					return !!hash;
				},

				cancelBounty: async (id, reason, contributorAgreed) => {
					const b = find(id);
					if (!b) return false;
					const caller = get().wallet?.address;
					const path = escrow.cancellationPath(b);
					const refund = path.refund;
					const hash = await run({
						bountyId: id,
						title: refund ? "Cancel & refund" : "Cancel bounty",
						summary: refund ? `Return ${formatAmount(refund)} to your wallet` : `Cancel ${b.id}`,
						fn: refund ? "cancel_and_refund" : "cancel_bounty",
						rows: walletRows(b, [
							{ label: "Refund", value: formatAmount(refund) },
							...(path.needsContributor ? [{ label: "Contributor", value: `${shortAddress(b.contributor)} · agreed` }] : []),
						]),
						guard: () => escrow.canCancel(find(id)!, caller, contributorAgreed),
						txs: refund ? [{ type: "cancel" }, { type: "refund", amount: refund, to: b.issuer }] : [{ type: "cancel" }],
						apply: (s, now) => ({
							balances: refund ? credit(s.balances, b.issuer, refund) : s.balances,
							bounties: mapBounty(s.bounties, id, (x) => ({
								...x,
								escrowBalance: 0,
								status: refund ? "refunded" : "cancelled",
								updatedAt: now,
								cancellation: { reason, cancelledAt: now, contributorAgreed },
							})),
						}),
						success: refund
							? { title: "Refund confirmed", description: `${formatAmount(refund)} returned to your wallet.`, href: "/history" }
							: { title: "Bounty cancelled" },
					});
					return !!hash;
				},
			};
		},
		{
			name: "boluck-demo",
			version: 2,
			storage: createJSONStorage(() => localStorage),
			skipHydration: true,
			// Older demo data (v1) used a different shape — start fresh.
			migrate: () => ({ wallet: null, role: "issuer", ...seed(), simulateFailures: false }) as unknown as AppState,
			partialize: (s) => ({
				wallet: s.wallet,
				role: s.role,
				bounties: s.bounties,
				transactions: s.transactions,
				balances: s.balances,
				simulateFailures: s.simulateFailures,
			}),
			onRehydrateStorage: () => () => useAppStore.setState({ hydrated: true }),
		},
	),
);

/* ---------- selectors ---------- */

export const useBounty = (id: string) => useAppStore((s) => s.bounties.find((b) => b.id === id));

export const useWalletBalance = () => useAppStore((s) => (s.wallet ? s.balances[s.wallet.address] : undefined));
