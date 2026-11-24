import { LayoutGrid } from "lucide-react";
import { STATUS_META, STEPS, stepIndex } from "@repo/stellar/status";
import { Badge } from "@repo/ui/badge";
import { IconTile } from "@repo/ui/panel";
import { Stepper } from "@repo/ui/stepper";

/** A sample in-progress bounty, as in the landing design. */
export function PreviewCard() {
	const status = "in_progress";
	return (
		<div className="mt-12 animate-fade-up [animation-delay:240ms] lg:max-w-[684px] 3xl:max-w-[900px]">
			<div className="animate-float rounded-[var(--radius-md)] border border-line bg-surface/90 p-5 backdrop-blur-sm sm:p-8">
				<div className="flex items-start gap-4">
					<IconTile>
						<LayoutGrid />
					</IconTile>
					<div className="min-w-0">
						<p className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
							BOL-0253 · stellar common{" "}
							<Badge tone={STATUS_META[status].tone} pulse>
								{STATUS_META[status].label}
							</Badge>
						</p>
						<p className="mt-1.5 font-display text-lg font-bold tracking-[-0.02em] text-ink sm:text-2xl">
							Build contributor onboarding flow
						</p>
						<p className="mt-1 text-[10px] text-muted">Deadline Jan 15, 2027 · Stellar Testnet</p>
					</div>
				</div>
				<p className="mt-6 font-display text-2xl font-bold text-ink">
					$300 <span className="text-base text-muted">USDC</span>
				</p>
				<p className="mt-1 text-[10px] text-primary">Reward reserved in escrow</p>
				<div className="mt-6 rounded-[var(--radius-sm)] border border-line px-3 py-4 sm:px-5">
					<Stepper labels={STEPS.map((s) => s.label)} done={stepIndex(status)} compact label="Bounty progress" />
				</div>
			</div>
		</div>
	);
}
