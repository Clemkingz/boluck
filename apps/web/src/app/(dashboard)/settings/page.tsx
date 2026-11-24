import type { Metadata } from "next";
import { LIVE } from "@/lib/api/config";
import { SettingsView } from "@/features/settings/Settings";

export const metadata: Metadata = { title: LIVE ? "Settings" : "Demo settings", robots: { index: false } };

export default function SettingsPage() {
	return <SettingsView />;
}
