import { Check, Lock, ShieldCheck } from "lucide-react";

/** Animated escrow illustration from the issuer overview hero: shield in concentric rings. */
export function EscrowOrb() {
	return (
		<div className="relative size-40 shrink-0" aria-hidden>
			<div className="absolute inset-0 rounded-full border border-primary/70" />
			<div className="absolute inset-0 animate-spin-slow">
				<span className="absolute -top-0 right-1 grid size-7 place-items-center rounded-full border border-line bg-surface text-muted">
					<Lock className="size-3.5" />
				</span>
			</div>
			<div className="absolute inset-0 animate-spin-slower">
				<span className="absolute bottom-3 -left-2 grid size-7 place-items-center rounded-full bg-surface text-primary">
					<Check className="size-4" />
				</span>
			</div>
			<div className="absolute inset-6 rounded-full border border-primary/60" />
			<div className="absolute inset-12 grid place-items-center rounded-full bg-elevated">
				<ShieldCheck className="size-8 text-primary" />
			</div>
			<div className="absolute inset-12 animate-pulse-ring rounded-full border border-primary/50" />
		</div>
	);
}
