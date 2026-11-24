/**
 * Escrow-rule tests mirroring the PRD's "Funding, Approval, Payout & Refund
 * Testing" scenarios. The Boluck API enforces the same rules on Stellar.
 */
import { describe, expect, it } from "vitest";
import {
	canAccept,
	canAssign,
	canCancel,
	canFund,
	canRelease,
	canReview,
	canSubmit,
	cancellationPath,
	validateReward,
} from "./escrow";
import { mockAddress } from "./address";
import type { Bounty } from "./bounty";

const SAM = mockAddress("issuer");
const ADA = mockAddress("contributor");

const STRANGER = "G" + "X".repeat(55);

const bounty = (over: Partial<Bounty> = {}): Bounty => ({
	id: "BOL-0001",
	title: "Test",
	project: "QA",
	icon: "layout",
	description: "A test bounty",
	token: "USDC",
	rewardAmount: 300,
	escrowBalance: 0,
	deadline: "2099-01-01T00:00:00.000Z",
	requirements: ["r"],
	acceptanceCriteria: ["a"],
	issuer: SAM,
	issuerName: "Sam",
	status: "draft",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	submissions: [],
	...over,
});

const funded = (over: Partial<Bounty> = {}) => bounty({ status: "funded", escrowBalance: 300, ...over });

describe("creation & funding", () => {
	it("rejects invalid reward amounts", () => {
		expect(validateReward(0)).not.toBeNull();
		expect(validateReward(-5)).not.toBeNull();
		expect(validateReward(Number.NaN)).not.toBeNull();
		expect(validateReward(300)).toBeNull();
	});
	it("lets only the issuer fund, with enough balance", () => {
		expect(canFund(bounty(), SAM, { usdc: 500, xlm: 0 })).toBeNull();
		expect(canFund(bounty(), STRANGER, { usdc: 500, xlm: 0 })).toMatch(/issuer/);
		expect(canFund(bounty(), SAM, { usdc: 100, xlm: 0 })).toMatch(/Insufficient/);
	});
	it("cannot fund twice", () => {
		expect(canFund(funded(), SAM, { usdc: 500, xlm: 0 })).not.toBeNull();
	});
});

describe("assignment", () => {
	it("requires funding before assignment", () => {
		expect(canAssign(bounty(), SAM, ADA)).not.toBeNull();
		expect(canAssign(funded(), SAM, ADA)).toBeNull();
	});
	it("blocks unauthorized assignment and self-assignment", () => {
		expect(canAssign(funded(), STRANGER, ADA)).toMatch(/issuer/);
		expect(canAssign(funded(), SAM, SAM)).not.toBeNull();
	});
	it("only the assigned contributor accepts", () => {
		const b = funded({ status: "assigned", contributor: ADA });
		expect(canAccept(b, ADA)).toBeNull();
		expect(canAccept(b, STRANGER)).not.toBeNull();
	});
});

describe("submission, review & payout", () => {
	const inProgress = funded({ status: "in_progress", contributor: ADA });
	it("only the assigned contributor submits", () => {
		expect(canSubmit(inProgress, ADA)).toBeNull();
		expect(canSubmit(inProgress, STRANGER)).not.toBeNull();
	});
	it("rejects unauthorized issuer approval", () => {
		const submitted = { ...inProgress, status: "submitted" as const };
		expect(canReview(submitted, SAM)).toBeNull();
		expect(canReview(submitted, STRANGER)).toMatch(/issuer/);
	});
	it("blocks payout when escrow is insufficient", () => {
		expect(canRelease({ ...inProgress, status: "approved", escrowBalance: 100 }, SAM)).toMatch(/blocked/);
	});
	it("rejects a repeated payout", () => {
		expect(canRelease({ ...inProgress, status: "paid", escrowBalance: 0 }, SAM)).toMatch(/already been paid/);
	});
});

describe("cancellation & refunds", () => {
	it("cancels an unfunded bounty freely with no refund", () => {
		expect(cancellationPath(bounty())).toMatchObject({ rule: "unfunded", allowed: true, refund: 0 });
		expect(canCancel(bounty(), SAM, false)).toBeNull();
	});
	it("refunds a funded, unassigned bounty in full", () => {
		expect(cancellationPath(funded())).toMatchObject({ rule: "unassigned", refund: 300 });
	});
	it("requires contributor agreement for an assigned bounty", () => {
		const b = funded({ status: "in_progress", contributor: ADA });
		expect(canCancel(b, SAM, false)).toMatch(/agree/);
		expect(canCancel(b, SAM, true)).toBeNull();
	});
	it("never refunds a paid bounty", () => {
		expect(canCancel(bounty({ status: "paid" }), SAM, true)).not.toBeNull();
	});
	it("only the issuer may cancel", () => {
		expect(canCancel(funded(), STRANGER, true)).toMatch(/issuer/);
	});
});
