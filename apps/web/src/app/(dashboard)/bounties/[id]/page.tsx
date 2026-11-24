import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { BountyDetail } from "@/features/bounties/components/BountyDetail";

export const metadata: Metadata = { title: "Bounty details" };

export default function Page({ params }: PageProps<"/bounties/[id]">) {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<BountyDetail params={params} />
		</Suspense>
	);
}
