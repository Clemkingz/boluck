/**
 * Seed data used in demo mode (`NEXT_PUBLIC_DEMO_MODE=1`) in place of the Boluck API.
 * Mirrors the content of the Figma designs. Everything here is deterministic so
 * server and client renders match.
 */
import type { Balance, Bounty, DemoAccount, Transaction, TxType } from "@repo/stellar/bounty";
import { mockAddress, mockTxHash } from "@repo/stellar/address";

export const SAM = mockAddress("boluck-sam-andrew", "GC6X", "8QJP");
export const ADA = mockAddress("boluck-ada-okafor", "GFTRV", "YHJG");
const KOFI = mockAddress("boluck-kofi-mensah", "GB7K", "4M2P");
const ORBIT = mockAddress("boluck-orbit-protocol", "GQTH", "OMOC");
const LUMINA = mockAddress("boluck-lumina-finance", "GCA2", "8D1N");

/** The two demo wallets. Switching the Issuer/Contributor lens switches between them. */
export const DEMO_ACCOUNTS: Record<"issuer" | "contributor", DemoAccount> = {
	issuer: { address: SAM, name: "Sam Andrew", initials: "SA", role: "issuer" },
	contributor: { address: ADA, name: "Ada Okafor", initials: "AO", role: "contributor" },
};

export const ACCOUNT_NAMES: Record<string, string> = {
	[SAM]: "Sam Andrew",
	[ADA]: "Ada Okafor",
	[KOFI]: "Kofi Mensah",
	[ORBIT]: "Orbit Protocol",
	[LUMINA]: "Lumina Finance",
};

export const SEED_BALANCES: Record<string, Balance> = {
	[SAM]: { usdc: 2_500, xlm: 9_820.5 },
	[ADA]: { usdc: 600, xlm: 312.4 },
	[KOFI]: { usdc: 40, xlm: 120 },
	[ORBIT]: { usdc: 5_000, xlm: 15_000 },
	[LUMINA]: { usdc: 3_000, xlm: 8_000 },
};

const BRIEF =
	"Design and implement a refined first-run onboarding experience for new Stellar contributors, including wallet context and a clear first contribution path.";

export const SEED_BOUNTIES: Bounty[] = [
	{
		id: "BOL-0253",
		title: "Build contributor onboarding flow",
		project: "Stellar commons",
		icon: "layout",
		description: BRIEF,
		token: "USDC",
		rewardAmount: 300,
		escrowBalance: 0,
		deadline: "2027-01-15T23:59:00.000Z",
		requirements: [
			"All requested deliverables must be submitted with accessible links.",
			"The completed work must meet all specified project functionalities.",
		],
		acceptanceCriteria: [
			"Responsive desktop and mobile layouts",
			"Accessible keyboard navigation",
			"Add a concise contributor guide",
		],
		issuer: SAM,
		issuerName: "Sam Andrew",
		contributor: ADA,
		status: "draft",
		createdAt: "2026-11-23T08:45:00.000Z",
		updatedAt: "2026-11-23T08:45:00.000Z",
		submissions: [],
	},
	{
		id: "BOL-0248",
		title: "Ship the wallet setup checklist",
		project: "Stellar commons",
		icon: "layout",
		description:
			"Create an in-app checklist that walks new contributors through installing a wallet, switching to Testnet and funding a test account.",
		token: "USDC",
		rewardAmount: 850,
		escrowBalance: 850,
		deadline: "2026-12-18T23:59:00.000Z",
		requirements: [
			"All requested deliverables must be submitted with accessible links.",
			"The completed work must meet all specified project functionalities.",
		],
		acceptanceCriteria: ["Load recent testnet transactions", "Show clear empty and error states", "Add an integration note"],
		issuer: SAM,
		issuerName: "Sam Andrew",
		contributor: ADA,
		status: "submitted",
		createdAt: "2026-11-02T10:00:00.000Z",
		updatedAt: "2026-11-24T07:05:00.000Z",
		submissions: [
			{
				id: "SUB-1",
				deliverableUrl: "https://github.com/stellar/commons/pull/123",
				notes:
					"Onboarding is implemented with wallet-connection guidance, responsive layouts, and a concise getting-started checklist.",
				evidence: "https://github.com/stellar/commons/issues/281",
				submittedAt: "2026-11-24T07:05:00.000Z",
			},
		],
	},
	{
		id: "BOL-0247",
		title: "Integrate wallet activity API",
		project: "Orbit Protocol",
		icon: "code",
		description: "Connect the wallet activity endpoint to the dashboard so contributors can see recent testnet transactions.",
		token: "USDC",
		rewardAmount: 1_200,
		escrowBalance: 1_200,
		deadline: "2026-12-22T23:59:00.000Z",
		requirements: ["Typed API client with retries", "Unit tests for the parser"],
		acceptanceCriteria: ["Load recent testnet transactions", "Show clear empty and error states", "Add an integration note"],
		issuer: SAM,
		issuerName: "Sam Andrew",
		contributor: ADA,
		status: "in_progress",
		createdAt: "2026-11-10T09:12:00.000Z",
		updatedAt: "2026-11-20T14:30:00.000Z",
		submissions: [],
	},
	{
		id: "BOL-0246",
		title: "Polish transaction history page",
		project: "Lumina Finance",
		icon: "sparkle",
		description: "Tidy the payment history table: better empty states, mobile layout and copyable references.",
		token: "USDC",
		rewardAmount: 450,
		escrowBalance: 450,
		deadline: "2026-12-25T23:59:00.000Z",
		requirements: ["Matches the design system", "Works from 320px to 1440px"],
		acceptanceCriteria: ["Responsive table", "Empty and loading states", "Copyable references"],
		issuer: SAM,
		issuerName: "Sam Andrew",
		status: "funded",
		createdAt: "2026-11-18T12:00:00.000Z",
		updatedAt: "2026-11-18T12:20:00.000Z",
		submissions: [],
	},
	{
		id: "BOL-0245",
		title: "Write a Stellar getting-started guide",
		project: "Stellar commons",
		icon: "doc",
		description: "A short guide that takes a developer from zero to a funded Testnet account and first payment.",
		token: "USDC",
		rewardAmount: 600,
		escrowBalance: 0,
		deadline: "2027-01-02T23:59:00.000Z",
		requirements: ["Runnable code samples", "Screenshots for each step"],
		acceptanceCriteria: ["Reviewed by a maintainer", "Published to the docs site"],
		issuer: SAM,
		issuerName: "Sam Andrew",
		contributor: ADA,
		status: "paid",
		createdAt: "2026-10-20T09:00:00.000Z",
		updatedAt: "2026-11-14T10:42:00.000Z",
		submissions: [
			{
				id: "SUB-1",
				deliverableUrl: "https://github.com/stellar/commons/pull/98",
				notes: "Guide published with runnable samples.",
				evidence: "https://docs.example.com/stellar-guide",
				submittedAt: "2026-11-12T10:00:00.000Z",
				review: { decision: "approved", comment: "Great work.", reviewedAt: "2026-11-14T10:40:00.000Z" },
			},
		],
	},
	{
		id: "BOL-0244",
		title: "Audit escrow event indexing",
		project: "Orbit Protocol",
		icon: "shield",
		description: "Review the indexer that stores funding, approval, payout and refund events and report any gaps.",
		token: "USDC",
		rewardAmount: 900,
		escrowBalance: 900,
		deadline: "2027-01-10T23:59:00.000Z",
		requirements: ["Written report", "Reproduction steps for each finding"],
		acceptanceCriteria: ["Covers every escrow event", "Matches on-chain records"],
		issuer: ORBIT,
		issuerName: "Orbit Protocol",
		contributor: ADA,
		status: "assigned",
		createdAt: "2026-11-19T11:00:00.000Z",
		updatedAt: "2026-11-21T09:00:00.000Z",
		submissions: [],
	},
	{
		id: "BOL-0250",
		title: "Design a dark-mode chart palette",
		project: "Lumina Finance",
		icon: "palette",
		description: "Propose an accessible categorical and sequential palette for charts on dark surfaces.",
		token: "USDC",
		rewardAmount: 350,
		escrowBalance: 350,
		deadline: "2027-01-20T23:59:00.000Z",
		requirements: ["Figma file with tokens", "Contrast report"],
		acceptanceCriteria: ["WCAG AA on dark surfaces", "Works for colour-blind users"],
		issuer: LUMINA,
		issuerName: "Lumina Finance",
		status: "funded",
		createdAt: "2026-11-21T08:00:00.000Z",
		updatedAt: "2026-11-21T08:10:00.000Z",
		submissions: [],
	},
	{
		id: "BOL-0241",
		title: "Translate docs into French",
		project: "Stellar commons",
		icon: "doc",
		description: "Translate the contributor onboarding guide and FAQ into French.",
		token: "USDC",
		rewardAmount: 200,
		escrowBalance: 0,
		deadline: "2026-11-30T23:59:00.000Z",
		requirements: ["Native-level French"],
		acceptanceCriteria: ["Reviewed by a second native speaker"],
		issuer: SAM,
		issuerName: "Sam Andrew",
		status: "refunded",
		createdAt: "2026-11-01T09:00:00.000Z",
		updatedAt: "2026-11-08T10:10:00.000Z",
		submissions: [],
		cancellation: { reason: "Scope moved to a later sprint.", cancelledAt: "2026-11-08T10:05:00.000Z", contributorAgreed: false },
	},
];

let ledger = 1_291_400;
function tx(bountyId: string, type: TxType, timestamp: string, from: string, extra: Partial<Transaction> = {}): Transaction {
	ledger += 89;
	return {
		hash: mockTxHash(`${bountyId}-${type}-${timestamp}`),
		bountyId,
		type,
		from,
		ledger,
		timestamp,
		status: "success",
		...extra,
	};
}

export const SEED_TRANSACTIONS: Transaction[] = [
	tx("BOL-0245", "create", "2026-10-20T09:00:00.000Z", SAM),
	tx("BOL-0245", "fund", "2026-10-20T09:05:00.000Z", SAM, { amount: 600 }),
	tx("BOL-0245", "assign", "2026-10-21T10:00:00.000Z", SAM, { to: ADA }),
	tx("BOL-0245", "accept", "2026-10-21T12:00:00.000Z", ADA),
	tx("BOL-0241", "create", "2026-11-01T09:00:00.000Z", SAM),
	tx("BOL-0241", "fund", "2026-11-01T09:10:00.000Z", SAM, { amount: 200 }),
	tx("BOL-0248", "create", "2026-11-02T10:00:00.000Z", SAM),
	tx("BOL-0248", "fund", "2026-11-02T10:04:00.000Z", SAM, { amount: 850 }),
	tx("BOL-0248", "assign", "2026-11-02T10:05:00.000Z", SAM, { to: ADA }),
	tx("BOL-0248", "accept", "2026-11-03T09:00:00.000Z", ADA),
	tx("BOL-0241", "cancel", "2026-11-08T10:05:00.000Z", SAM),
	tx("BOL-0241", "refund", "2026-11-08T10:10:00.000Z", SAM, { amount: 200, to: SAM }),
	tx("BOL-0247", "create", "2026-11-10T09:12:00.000Z", SAM),
	tx("BOL-0247", "fund", "2026-11-10T09:20:00.000Z", SAM, { amount: 1_200 }),
	tx("BOL-0247", "assign", "2026-11-10T09:21:00.000Z", SAM, { to: ADA }),
	tx("BOL-0245", "submit", "2026-11-12T10:00:00.000Z", ADA),
	tx("BOL-0245", "approve", "2026-11-14T10:40:00.000Z", SAM),
	tx("BOL-0245", "payout", "2026-11-14T10:42:00.000Z", SAM, { amount: 600, to: ADA }),
	tx("BOL-0246", "create", "2026-11-18T12:00:00.000Z", SAM),
	tx("BOL-0246", "fund", "2026-11-18T12:20:00.000Z", SAM, { amount: 450 }),
	tx("BOL-0244", "create", "2026-11-19T11:00:00.000Z", ORBIT),
	tx("BOL-0244", "fund", "2026-11-19T11:30:00.000Z", ORBIT, { amount: 900 }),
	tx("BOL-0247", "accept", "2026-11-20T14:30:00.000Z", ADA),
	tx("BOL-0250", "create", "2026-11-21T08:00:00.000Z", LUMINA),
	tx("BOL-0250", "fund", "2026-11-21T08:10:00.000Z", LUMINA, { amount: 350 }),
	tx("BOL-0244", "assign", "2026-11-21T09:00:00.000Z", ORBIT, { to: ADA }),
	tx("BOL-0253", "create", "2026-11-23T08:45:00.000Z", SAM),
	tx("BOL-0248", "submit", "2026-11-24T07:05:00.000Z", ADA),
].reverse();
