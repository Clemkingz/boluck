import type { Metadata } from "next";
import { SettingsView } from "@/features/settings/Settings";

export const metadata: Metadata = { title: "Demo settings", robots: { index: false } };

export default function SettingsPage() {
	return <SettingsView />;
}
