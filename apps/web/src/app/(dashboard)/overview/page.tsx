import type { Metadata } from "next";
import { OverviewView } from "@/features/overview/Overview";

export const metadata: Metadata = {
	title: "Overview",
	description: "Your Boluck workspace: active bounties, escrow balances, reviews and payouts.",
};

export default function OverviewPage() {
	return <OverviewView />;
}
