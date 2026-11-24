import { AppShell } from "@/components/layouts/AppShell";

export default function AppLayout({ children }: LayoutProps<"/">) {
	return <AppShell>{children}</AppShell>;
}
