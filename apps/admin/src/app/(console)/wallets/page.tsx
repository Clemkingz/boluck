import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/ui";
import { WalletList } from "@/features/wallets/Wallets";

export const metadata: Metadata = { title: "Wallets" };

export default function Page() {
	return (
		<Suspense fallback={<Loading />}>
			<WalletList />
		</Suspense>
	);
}
