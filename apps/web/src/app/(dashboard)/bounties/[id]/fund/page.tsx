import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { FundBounty } from "@/features/bounties/components/FundBounty";

export const metadata: Metadata = { title: "Fund bounty" };

export default function Page({ params }: PageProps<"/bounties/[id]/fund">) {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<FundBounty params={params} />
		</Suspense>
	);
}
