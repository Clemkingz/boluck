import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { RefundsView } from "@/features/refunds/Refunds";

export const metadata: Metadata = {
	title: "Refunds & safety",
	description: "Check cancellation eligibility and refund rules enforced by the Boluck escrow contract.",
};

export default function RefundsPage() {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<RefundsView />
		</Suspense>
	);
}
