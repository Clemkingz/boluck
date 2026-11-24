"use client";

import { useMemo } from "react";
import type { Bounty, Role, Transaction } from "@repo/stellar/bounty";
import { useAppStore } from "./store";
import { LIVE } from "@/lib/api/config";

export function bountiesForRole(bounties: Bounty[], address: string | undefined, role: Role) {
	if (!address) return [];
	return bounties.filter((b) => (role === "issuer" ? b.issuer === address : b.contributor === address));
}

/** Bounties the connected wallet issued (issuer) or is assigned to (contributor). */
export function useRoleBounties() {
	const bounties = useAppStore((s) => s.bounties);
	const address = useAppStore((s) => s.wallet?.address);
	const role = useAppStore((s) => s.role);
	return useMemo(() => bountiesForRole(bounties, address, role), [bounties, address, role]);
}

/** Transactions on any bounty the wallet is a party to. */
export function useMyTransactions(): Transaction[] {
	const bounties = useAppStore((s) => s.bounties);
	const transactions = useAppStore((s) => s.transactions);
	const address = useAppStore((s) => s.wallet?.address);
	return useMemo(() => {
		if (!address) return [];
		// The API's history is already this wallet's.
		if (LIVE) return transactions;
		const mine = new Set(bounties.filter((b) => b.issuer === address || b.contributor === address).map((b) => b.id));
		return transactions.filter((t) => mine.has(t.bountyId) || t.from === address || t.to === address);
	}, [bounties, transactions, address]);
}

/** Demo notifications: confirmed events on my bounties triggered by someone else. Live uses `GET /notifications`. */
export function useNotifications() {
	const txs = useMyTransactions();
	const address = useAppStore((s) => s.wallet?.address);
	return useMemo(() => txs.filter((t) => t.status === "success" && t.from !== address).slice(0, 8), [txs, address]);
}
