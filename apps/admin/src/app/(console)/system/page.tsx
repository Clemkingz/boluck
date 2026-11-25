import type { Metadata } from "next";
import { SystemView } from "@/features/system/System";

export const metadata: Metadata = { title: "System" };

export default function Page() {
	return <SystemView />;
}
