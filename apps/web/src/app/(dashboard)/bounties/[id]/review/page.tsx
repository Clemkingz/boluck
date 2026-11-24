import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { ReviewSubmission } from "@/features/bounties/components/ReviewSubmission";

export const metadata: Metadata = { title: "Review work" };

export default function Page({ params }: PageProps<"/bounties/[id]/review">) {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<ReviewSubmission params={params} />
		</Suspense>
	);
}
