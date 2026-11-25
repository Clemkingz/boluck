import type { Metadata } from "next";
import { WalletDetail } from "@/features/wallets/Wallets";

export const metadata: Metadata = { title: "Wallet" };

export default function Page() {
	return <WalletDetail />;
}
