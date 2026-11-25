import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { BountyList } from "@/features/bounties/BountyList";

export const metadata: Metadata = { title: "Bounties" };

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<BountyList />
		</Suspense>
	);
}
