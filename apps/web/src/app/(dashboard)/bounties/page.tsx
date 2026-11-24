import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { BountiesView } from "@/features/bounties/components/ExploreBounties";

export const metadata: Metadata = {
	title: "Explore bounties",
	description: "Funded bounties with visible rewards, clear briefs and escrow set aside before work begins.",
};

export default function BountiesPage() {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<BountiesView />
		</Suspense>
	);
}
