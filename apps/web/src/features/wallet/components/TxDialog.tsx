"use client";

import { ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Modal } from "@repo/ui/modal";
import { walletName } from "@/features/wallet/wallets";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";

/**
 * The wallet's transaction confirmation (design: "Funding confirmation 1").
 * authorize → user confirms/rejects, pending → ledger confirmation animation,
 * success → animated check, error → failure details.
 */
export function TxDialog() {
	const tx = useAppStore((s) => s.tx);
	const provider = useAppStore((s) => s.wallet?.provider);
	const confirmTx = useAppStore((s) => s.confirmTx);
	const rejectTx = useAppStore((s) => s.rejectTx);
	const closeTx = useAppStore((s) => s.closeTx);
	const name = walletName(provider);
	const busy = tx.stage === "pending" || tx.stage === "success";

	// Highlight the amount inside the summary (e.g. "Lock 300.00 USDC in escrow").
	const summary = tx.summary?.split(/(\d[\d,]*\.\d{2} USDC)/);

	return (
		<Modal
			open={tx.stage !== "idle"}
			onClose={tx.stage === "authorize" ? rejectTx : closeTx}
			dismissible={!busy}
			label={tx.title}
		>
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-2 text-sm font-medium text-ink">
					<span className="grid size-5 place-items-center rounded-[4px] bg-deep text-[10px] font-semibold">{name[0]}</span>
					{name}
				</span>
				<span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">TestNet</span>
			</div>

			{tx.stage === "authorize" && (
				<div className="animate-fade-up">
					<div className="mt-8 text-center">
						<h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Confirm transaction</h2>
						{summary && (
							<p className="mt-1 text-sm text-muted">
								{summary.map((part, i) =>
									/USDC$/.test(part) ? (
										<span key={i} className="font-semibold text-primary">
											{part}
										</span>
									) : (
										part
									),
								)}
							</p>
						)}
					</div>
					<dl className="mt-6 space-y-3 rounded-[var(--radius-md)] border border-line bg-canvas/40 p-4 text-xs sm:text-sm">
						{tx.fn && <Row label="Function" value={tx.fn.charAt(0).toUpperCase() + tx.fn.slice(1)} mono />}
						{tx.rows?.map((r) => (
							<Row key={r.label} label={r.label} value={r.value} />
						))}
					</dl>
					<p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
						<ShieldCheck className="mt-px size-4 shrink-0 text-primary" />
						The funds can only leave escrow when the issuer approves the work, or as a refund under the bounty&apos;s cancellation
						rules.
					</p>
					<div className="mt-6 grid grid-cols-2 gap-4">
						<Button variant="secondary" size="lg" onClick={rejectTx}>
							Reject
						</Button>
						<Button size="lg" onClick={confirmTx} autoFocus>
							Confirm
						</Button>
					</div>
				</div>
			)}

			{busy && <Progress done={tx.stage === "success"} title={tx.title} />}

			{tx.stage === "error" && (
				<div className="mt-8 animate-fade-up text-center">
					<span className="mx-auto grid size-14 place-items-center rounded-full bg-attention/15 text-attention">
						<XCircle className="size-7" />
					</span>
					<h2 className="mt-4 font-display text-xl font-bold text-ink">{tx.title} didn&apos;t go through</h2>
					<p className="mt-2 text-sm text-muted">{tx.error}</p>
					<Button className="mt-6" variant="secondary" fullWidth size="lg" onClick={closeTx}>
						Close
					</Button>
				</div>
			)}
		</Modal>
	);
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<dt className="text-muted">{label}</dt>
			<dd className={cn("truncate text-right font-medium text-ink", mono && "font-mono text-xs")}>{value}</dd>
		</div>
	);
}

/** Ledger confirmation: an escrow ring that fills, then a drawn check mark. */
function Progress({ done, title }: { done: boolean; title: string }) {
	return (
		<div className="mt-8 flex flex-col items-center pb-2 text-center" aria-live="polite">
			<div className="relative size-20">
				<svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden>
					<circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-line)" strokeWidth="4" />
					<circle
						cx="40"
						cy="40"
						r="34"
						fill="none"
						stroke="var(--color-primary)"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray="214"
						className={cn("transition-[stroke-dashoffset] ease-out", done ? "duration-300" : "duration-[1500ms]")}
						style={{ strokeDashoffset: done ? 0 : 40 }}
					/>
				</svg>
				<div
					className={cn(
						"absolute inset-3 grid place-items-center rounded-full transition-colors duration-300",
						done ? "bg-primary" : "bg-deep",
					)}
				>
					{done ? (
						<svg viewBox="0 0 24 24" className="size-8 text-on-primary" fill="none" aria-hidden>
							<path
								d="M5 12.5l4.5 4.5L19 7.5"
								stroke="currentColor"
								strokeWidth="2.6"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeDasharray="24"
								className="animate-draw"
							/>
						</svg>
					) : (
						<ShieldCheck className="size-7 animate-lock text-primary" />
					)}
				</div>
				{!done && <span className="absolute inset-0 animate-pulse-ring rounded-full border border-primary/60" aria-hidden />}
			</div>
			<h2 className="mt-5 font-display text-xl font-bold text-ink">
				{done ? "Transaction confirmed" : "Submitting to Stellar Testnet"}
			</h2>
			<p className="mt-1.5 text-sm text-muted">
				{done ? `${title} recorded on the ledger.` : "Waiting for the network to confirm your signed transaction…"}
			</p>
		</div>
	);
}
