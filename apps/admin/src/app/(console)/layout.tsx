import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/layouts/AdminShell";

export default function ConsoleLayout({ children }: LayoutProps<"/">) {
	return (
		<AdminGate>
			<AdminShell>{children}</AdminShell>
		</AdminGate>
	);
}
