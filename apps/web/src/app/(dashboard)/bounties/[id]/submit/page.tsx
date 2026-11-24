import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { SubmitWork } from "@/features/bounties/components/SubmitWork";

export const metadata: Metadata = { title: "Submit work" };

export default function Page({ params }: PageProps<"/bounties/[id]/submit">) {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<SubmitWork params={params} />
		</Suspense>
	);
}
