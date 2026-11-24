import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { MyBounties } from "@/features/bounties/components/MyBounties";

export const metadata: Metadata = {
	title: "Your bounties",
	description: "The bounties you issued or were assigned, with rewards and escrow status.",
};

export default function BountiesPage() {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<MyBounties />
		</Suspense>
	);
}
