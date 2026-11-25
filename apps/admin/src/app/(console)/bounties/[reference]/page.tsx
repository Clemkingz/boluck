import type { Metadata } from "next";
import { BountyDetail } from "@/features/bounties/BountyDetail";

export const metadata: Metadata = { title: "Bounty" };

export default function Page() {
	return <BountyDetail />;
}
