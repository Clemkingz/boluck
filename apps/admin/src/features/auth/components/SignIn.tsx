"use client";

import { AlertTriangle, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { WalletId } from "@repo/stellar/bounty";
import { shortAddress } from "@repo/stellar/format";
import { Logo } from "@repo/ui/brand";
import { Button } from "@repo/ui/button";
import { IconTile } from "@repo/ui/panel";
import { Spinner } from "@repo/ui/spinner";
import { cn } from "@repo/ui/lib/utils";
import { detectPlatform, setAppNotOpenedHandler, varialAppStoreUrl, walletAvailability } from "@/features/wallet/kit";
import { VARIAL_STORES, WALLETS, walletName } from "@/features/wallet/wallets";
import { useAuth } from "../store";

/** Wallets an admin can sign in with: desktop extensions and Varial Mobile; phones get Varial Mobile only. */
const ADMIN_WALLETS: WalletId[] = ["freighter", "varial_mobile", "xbull", "albedo"];

/**
 * Admin sign-in: the same wallet sign-in as the product app, then the backend's allow-list check. A wallet that
 * isn't an admin is told so and signed back out.
 */
export function SignIn() {
	const signIn = useAuth((s) => s.signIn);
	const access = useAuth((s) => s.access);
	const deniedWallet = useAuth((s) => s.wallet);
	const error = useAuth((s) => s.error);
	const [busy, setBusy] = useState<WalletId | null>(null);
	const [missing, setMissing] = useState<WalletId | null>(null);
	const [available, setAvailable] = useState<Partial<Record<WalletId, boolean>>>({});
	const [phone, setPhone] = useState(false);
	const [appMissing, setAppMissing] = useState<{ retry: () => void } | null>(null);

	useEffect(() => {
		let alive = true;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only fact, read once after mount
		setPhone(detectPlatform() !== "desktop");
		setAppNotOpenedHandler((retry) => alive && setAppMissing({ retry }));
		const check = () => walletAvailability().then((a) => alive && setAvailable(a));
		void check();
		const t = setTimeout(check, 2000);
		window.addEventListener("focus", check);
		return () => {
			alive = false;
			clearTimeout(t);
			window.removeEventListener("focus", check);
			setAppNotOpenedHandler(null);
		};
	}, []);

	const wallets = WALLETS.filter((w) => ADMIN_WALLETS.includes(w.id) && w.platforms.includes(phone ? "phone" : "desktop"));

	const choose = async (id: WalletId) => {
		setMissing(null);
		setAppMissing(null);
		setBusy(id);
		const result = await signIn(id);
		setBusy(null);
		if (result === "missing") setMissing(id);
	};

	return (
		<div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] place-items-center px-4 py-10">
			<div className="w-full max-w-[420px] min-w-0 animate-fade-up">
				<div className="mb-6 flex items-center justify-between gap-3">
					<Logo href={null} size="sm" />
					<span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
						Admin console
					</span>
				</div>
				<section className="min-w-0 rounded-[var(--radius-xl)] border border-line bg-surface p-4 min-[360px]:p-6 sm:p-8">
					<div className="flex items-start gap-3">
						<IconTile size="lg">
							<ShieldCheck />
						</IconTile>
						<div className="min-w-0">
							<h1 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">Sign in to the console</h1>
							<p className="mt-1 text-sm text-muted">Use an admin wallet. Signing moves no funds.</p>
						</div>
					</div>

					{access === "denied" && (
						<p
							className="mt-6 flex animate-pop-in items-start gap-2 rounded-[var(--radius-md)] border border-attention/70 bg-attention/10 p-4 text-xs text-ink"
							role="alert"
						>
							<ShieldAlert className="mt-px size-4 shrink-0 text-attention" />
							<span>
								<span className="font-semibold">
									{deniedWallet ? shortAddress(deniedWallet.address) : "This wallet"} isn&apos;t an admin.
								</span>{" "}
								Sign in with a wallet on Boluck&apos;s admin list. You were signed out.
							</span>
						</p>
					)}
					{error && (
						<p
							className="mt-6 flex items-start gap-2 rounded-[var(--radius-md)] border border-attention/70 bg-attention/10 p-4 text-xs text-ink"
							role="alert"
						>
							<AlertTriangle className="mt-px size-4 shrink-0 text-attention" />
							<span className="min-w-0 break-words">
								<span className="font-semibold">{error.step}:</span> {error.message}
							</span>
						</p>
					)}

					<ul className="mt-6 space-y-3">
						{wallets.map((w) => {
							const detected = available[w.id];
							return (
								<li key={w.id}>
									<button
										onClick={() => void choose(w.id)}
										disabled={!!busy}
										className={cn(
											"group flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors min-[360px]:p-4",
											w.recommended
												? "border-primary bg-deep/50 hover:bg-deep/70"
												: "border-line bg-canvas/40 hover:border-subtle",
											"disabled:cursor-wait disabled:opacity-70",
										)}
									>
										<span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-line bg-elevated text-sm font-semibold text-ink">
											{w.name[0]}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-sm font-semibold text-ink">{w.name}</span>
											<span className="block truncate text-[10px] text-muted">{w.kind}</span>
										</span>
										<span className="max-w-[40%] shrink-0 text-right text-[10px] font-semibold text-primary">
											{busy === w.id ? (
												<span className="inline-flex items-center gap-1.5">
													<Spinner className="size-3.5" /> Check your wallet
												</span>
											) : w.id === "varial_mobile" ? (
												phone ? (
													"Opens the app"
												) : (
													"QR code"
												)
											) : detected === false ? (
												<span className="font-normal text-muted">Not detected · try anyway</span>
											) : detected ? (
												"Detected"
											) : null}
										</span>
									</button>
								</li>
							);
						})}
					</ul>

					{missing && (
						<p
							className="mt-4 rounded-[var(--radius-md)] border border-attention/70 bg-attention/10 p-4 text-xs text-ink"
							role="alert"
						>
							{walletName(missing)} didn&apos;t answer. Install or unlock it, then reload.{" "}
							<a
								href={WALLETS.find((w) => w.id === missing)?.installUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 font-semibold text-review hover:underline"
							>
								Install <ExternalLink className="size-3" />
							</a>
						</p>
					)}
					{appMissing && (
						<div
							className="mt-4 rounded-[var(--radius-md)] border border-review/70 bg-review/10 p-4 text-xs text-ink"
							role="alert"
						>
							Varial didn&apos;t open. Install the app (listed as Freighter), set it to Testnet, then try again.
							<div className="mt-2 flex flex-wrap gap-4">
								<a
									href={phone ? varialAppStoreUrl() : VARIAL_STORES.site}
									target="_blank"
									rel="noopener noreferrer"
									className="font-semibold text-review hover:underline"
								>
									Get Varial
								</a>
								<Button variant="ghost" size="sm" className="h-auto px-0 text-primary" onClick={appMissing.retry}>
									Open Varial again
								</Button>
							</div>
						</div>
					)}
				</section>
				<p className="mt-4 text-center text-[10px] text-muted">
					Access is checked by the Boluck API on every request. This console never asks for a secret key.
				</p>
			</div>
		</div>
	);
}
