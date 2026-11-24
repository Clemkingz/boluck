import type { Metadata } from "next";
import { HistoryView } from "@/features/history/TransactionHistory";

export const metadata: Metadata = {
	title: "Payment history",
	description: "Every payout, escrow deposit and refund with its recipient wallet and transaction reference.",
};

export default function HistoryPage() {
	return <HistoryView />;
}
