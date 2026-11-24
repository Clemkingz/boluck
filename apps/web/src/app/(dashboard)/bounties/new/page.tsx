import type { Metadata } from "next";
import { CreateBountyForm } from "@/features/bounties/components/CreateBounty";

export const metadata: Metadata = {
	title: "Create a bounty",
	description: "Describe the work, set the reward, and lock it in escrow before anyone starts.",
};

export default function NewBountyPage() {
	return <CreateBountyForm />;
}
