import type { Metadata } from "next";
import { Suspense } from "react";
import { EscrowLoader } from "@repo/ui/escrow-loader";
import { ConnectScreen } from "@/features/wallet/components/ConnectScreen";

export const metadata: Metadata = {
	title: "Connect your wallet",
	description: "Connect a Stellar wallet to open your Boluck workspace.",
};

/** Wallet connection (PRD screen 1b). The landing site hands off here with ?role=&wallet=. */
export default function ConnectPage() {
	return (
		<Suspense
			fallback={
				<div className="grid min-h-dvh place-items-center">
					<EscrowLoader label="Preparing wallet connection" />
				</div>
			}
		>
			<ConnectScreen />
		</Suspense>
	);
}
