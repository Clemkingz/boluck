import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layouts/AppShell";
import { EditDraft } from "@/features/bounties/components/EditDraft";

export const metadata: Metadata = { title: "Edit draft" };

export default function Page({ params }: PageProps<"/bounties/[id]/edit">) {
	return (
		<Suspense fallback={<PageSkeleton />}>
			<EditDraft params={params} />
		</Suspense>
	);
}
