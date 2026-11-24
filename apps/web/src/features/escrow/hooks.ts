"use client";

import { useMemo } from "react";
import type { Bounty, Role, Transaction } from "@repo/stellar/bounty";
import { useAppStore } from "./store";

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

/** Funded bounties without a contributor that the current wallet could take on. */
export function useOpenOpportunities() {
	const bounties = useAppStore((s) => s.bounties);
	const address = useAppStore((s) => s.wallet?.address);
	return useMemo(
		() => bounties.filter((b) => b.status === "funded" && !b.contributor && b.issuer !== address),
		[bounties, address],
	);
}

/** Transactions on any bounty the wallet is a party to. */
export function useMyTransactions(): Transaction[] {
	const bounties = useAppStore((s) => s.bounties);
	const transactions = useAppStore((s) => s.transactions);
	const address = useAppStore((s) => s.wallet?.address);
	return useMemo(() => {
		if (!address) return [];
		const mine = new Set(bounties.filter((b) => b.issuer === address || b.contributor === address).map((b) => b.id));
		return transactions.filter((t) => mine.has(t.bountyId) || t.from === address || t.to === address);
	}, [bounties, transactions, address]);
}

/** In-app notifications: confirmed events on my bounties triggered by someone else. */
export function useNotifications() {
	const txs = useMyTransactions();
	const address = useAppStore((s) => s.wallet?.address);
	return useMemo(() => txs.filter((t) => t.status === "success" && t.from !== address).slice(0, 8), [txs, address]);
}
