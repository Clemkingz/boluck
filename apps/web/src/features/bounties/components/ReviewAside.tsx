import { Check, ShieldCheck } from "lucide-react";
import { Panel } from "@repo/ui/panel";
import { formatAmount } from "@repo/stellar/format";
import type { Bounty } from "@repo/stellar/bounty";
import { stepIndex } from "@repo/stellar/status";

/** Right column on the submit / review screens. */
export function ReviewAside({ bounty }: { bounty: Bounty }) {
	// Funded → Assigned → In progress → Submitted
	const done = Math.max(0, Math.min(4, stepIndex(bounty.status) - 1));
	return (
		<div className="space-y-6">
			<Panel className="p-6">
				<p className="flex items-center gap-2 text-sm font-semibold text-ink">
					<ShieldCheck className="size-4 text-primary" /> The reward is waiting
				</p>
				<p className="mt-4 text-[10px] text-muted">
					{formatAmount(bounty.escrowBalance || bounty.rewardAmount)} reserved for the work you agreed to deliver.
				</p>
				<div
					className="mt-6 h-2 overflow-hidden rounded-full bg-canvas"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={4}
					aria-valuenow={done}
				>
					<div
						className="h-full origin-left animate-grow-x rounded-full bg-primary transition-[width] duration-700 ease-out"
						style={{ width: `${(done / 4) * 100}%` }}
					/>
				</div>
				<p className="mt-3 text-right text-[10px] text-primary">{done} of 4 review steps complete</p>
			</Panel>
			<Panel className="p-6">
				<p className="text-sm font-semibold text-ink">What gets checked</p>
				<ul className="mt-5 space-y-4 text-[10px] text-muted">
					{bounty.acceptanceCriteria.map((c) => (
						<li key={c} className="flex items-center gap-2.5">
							<Check className="size-3.5 shrink-0 text-primary" /> {c}
						</li>
					))}
				</ul>
			</Panel>
			<Panel className="p-6">
				<p className="text-sm font-semibold text-ink">A fair review</p>
				<p className="mt-3 text-[10px] leading-relaxed text-muted">
					Approving releases the agreed reward. Requesting changes returns the bounty for another submission.
				</p>
			</Panel>
		</div>
	);
}
