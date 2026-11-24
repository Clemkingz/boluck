import type { BountyStatus } from "@repo/stellar/bounty";
import { STEPS, stepIndex } from "@repo/stellar/status";
import { Stepper } from "@repo/ui/stepper";

const LABELS = STEPS.map((s) => s.label);

/** The six-step bounty lifecycle (Created → Paid) for a given status. */
export function LifecycleStepper({
	status,
	compact,
	className,
}: {
	status: BountyStatus;
	compact?: boolean;
	className?: string;
}) {
	return (
		<Stepper
			labels={LABELS}
			done={stepIndex(status)}
			complete={status === "paid"}
			compact={compact}
			label="Bounty progress"
			className={className}
		/>
	);
}
