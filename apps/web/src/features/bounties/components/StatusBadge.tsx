import { Badge } from "@repo/ui/badge";
import { STATUS_META } from "@repo/stellar/status";
import type { BountyStatus } from "@repo/stellar/bounty";

export function StatusBadge({ status, className }: { status: BountyStatus; className?: string }) {
	const meta = STATUS_META[status];
	return (
		<Badge
			tone={meta.tone}
			pulse={status === "in_progress" || status === "submitted" || status === "assigned"}
			className={className}
		>
			{meta.label}
		</Badge>
	);
}
