import Image from "next/image";
import mark from "./assets/boluck-mark.png";
import { cn } from "./lib/utils";

/**
 * Branded loading state: the Boluck mark inside an escrow "vault" ring that
 * spins while a progress arc fills — tailored to the lock-the-reward idea.
 */
export function EscrowLoader({ label = "Securing your workspace", className }: { label?: string; className?: string }) {
	return (
		<div className={cn("flex flex-col items-center text-center", className)} role="status" aria-live="polite">
			<div className="relative size-28">
				<span className="absolute inset-0 animate-pulse-ring rounded-full border border-primary/40" aria-hidden />
				<svg viewBox="0 0 112 112" className="absolute inset-0 animate-spin-slow" aria-hidden>
					<circle cx="56" cy="56" r="52" fill="none" stroke="var(--color-line)" strokeWidth="1.5" strokeDasharray="3 7" />
				</svg>
				<svg viewBox="0 0 112 112" className="absolute inset-0 animate-spin" style={{ animationDuration: "1.4s" }} aria-hidden>
					<circle cx="56" cy="56" r="44" fill="none" stroke="var(--color-elevated)" strokeWidth="4" />
					<circle
						cx="56"
						cy="56"
						r="44"
						fill="none"
						stroke="var(--color-primary)"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray="70 207"
					/>
				</svg>
				<div className="absolute inset-6 grid place-items-center rounded-full bg-surface">
					<Image src={mark} alt="" width={40} height={40} className="animate-lock" priority />
				</div>
			</div>
			<p className="mt-6 font-display text-base font-bold text-ink">
				{label}
				<span className="inline-flex w-5 justify-start">
					<span className="animate-pulse">…</span>
				</span>
			</p>
			<p className="mt-1 text-xs text-muted">Checking escrow on Stellar Testnet</p>
		</div>
	);
}
