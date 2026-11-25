import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { TxList } from "@/features/transactions/TxList";

export const metadata: Metadata = { title: "Transactions" };

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<TxList />
		</Suspense>
	);
}
