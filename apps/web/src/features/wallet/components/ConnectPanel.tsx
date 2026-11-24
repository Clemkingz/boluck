"use client";

import { AlertTriangle, ArrowRight, BriefcaseBusiness, CircleCheck, ExternalLink, PenTool, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@repo/ui/spinner";
import { LIVE } from "@/lib/api/config";
import {
	detectPlatform,
	inVarialApp,
	setAppNotOpenedHandler,
	varialAppStoreUrl,
	walletAvailability,
} from "@/features/wallet/kit";
import { Button, ButtonLink } from "@repo/ui/button";
import { IconTile } from "@repo/ui/panel";
import { VARIAL_STORES, WALLETS, walletName, type WalletOption } from "@/features/wallet/wallets";
import { shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES } from "@/lib/api/mock-data";
import type { Role, WalletId } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { toast } from "@repo/ui/toast";
import { WalletFlowModal } from "./WalletFlowModal";

const ROLES: { id: Role; label: string; sub: string; icon: typeof BriefcaseBusiness }[] = [
	{ id: "issuer", label: "Issuer", sub: "Post & fund bounties", icon: BriefcaseBusiness },
	{ id: "contributor", label: "Contributor", sub: "Do the work & get paid", icon: PenTool },
];

/**
 * "Connect your wallet" panel from the landing design: pick a role, pick a Stellar wallet.
 * Live: detects installed wallets, then connect → network check → sign the sign-in challenge. Desktop offers the
 * browser extensions (Varial first) and Varial Mobile by QR code; phones offer Varial Mobile, which opens the Varial
 * app (and Albedo, a web wallet); inside Varial's in-app browser only Varial Mobile.
 * Demo: Freighter/Varial is simulated as not installed (error + setup walkthrough); xBull and Albedo as ready.
 */
export function ConnectPanel({
	redirectTo = "/overview",
	initialRole = "issuer",
	autoStart,
	className,
}: {
	redirectTo?: string;
	initialRole?: Role;
	/** Resume a hand-off from the landing site: open this wallet's flow at a step. */
	autoStart?: { wallet: WalletId; startAt: number };
	className?: string;
}) {
	const router = useRouter();
	const hydrated = useAppStore((s) => s.hydrated);
	const wallet = useAppStore((s) => s.wallet);
	const connect = useAppStore((s) => s.connect);
	const disconnect = useAppStore((s) => s.disconnect);
	const [role, setRole] = useState<Role>(initialRole);
	const [failed, setFailed] = useState<WalletId | null>(null);
	const [installed, setInstalled] = useState<WalletId[]>([]);
	const [flow, setFlow] = useState<{ wallet: WalletId; startAt: number } | null>(LIVE ? null : (autoStart ?? null));
	const [available, setAvailable] = useState<Partial<Record<WalletId, boolean>>>({});
	const [connecting, setConnecting] = useState<WalletId | null>(null);
	/** Set when the Varial app didn't open on this phone; `retry` opens it again with the same pairing. */
	const [appMissing, setAppMissing] = useState<{ retry: () => void } | null>(null);
	// Device facts are only known in the browser (the server render assumes desktop).
	const [device, setDevice] = useState<{ phone: boolean; inApp: boolean; store: string }>({
		phone: false,
		inApp: false,
		store: VARIAL_STORES.site,
	});
	// Landing hand-off (`?wallet=`): highlight the wallet the person already picked.
	const picked = autoStart?.wallet;

	useEffect(() => {
		if (!LIVE) return;
		let alive = true;
		const platform = detectPlatform();
		// eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only facts, read once after mount
		setDevice({ phone: platform !== "desktop", inApp: inVarialApp(), store: varialAppStoreUrl(platform) });
		setAppNotOpenedHandler((retry) => alive && setAppMissing({ retry }));
		// Extensions inject their content scripts after the page loads and can take a moment to answer: check now,
		// again shortly after, and whenever the tab comes back (e.g. after installing or enabling Varial).
		const check = () => walletAvailability().then((a) => alive && setAvailable(a));
		void check();
		const timers = [setTimeout(check, 1500), setTimeout(check, 4000)];
		const onFocus = () => document.visibilityState === "visible" && void check();
		window.addEventListener("focus", onFocus);
		document.addEventListener("visibilitychange", onFocus);
		return () => {
			alive = false;
			timers.forEach(clearTimeout);
			window.removeEventListener("focus", onFocus);
			document.removeEventListener("visibilitychange", onFocus);
			setAppNotOpenedHandler(null);
		};
	}, []);

	const shown = !LIVE
		? WALLETS.filter((w) => w.id !== "varial_mobile")
		: device.inApp
			? WALLETS.filter((w) => w.id === "varial_mobile")
			: WALLETS.filter((w) => w.platforms.includes(device.phone ? "phone" : "desktop"));

	const stateOf = (w: WalletOption) =>
		LIVE ? (available[w.id] === false ? "install" : "ready") : installed.includes(w.id) ? "ready" : w.state;

	const choose = async (w: WalletOption) => {
		if (LIVE) {
			// Detection can miss an extension that answers slowly, so Varial is always tried; other extensions that
			// weren't detected go to their install page.
			if (available[w.id] === false && w.id !== "freighter" && w.id !== "varial_mobile") {
				window.open(w.installUrl, "_blank", "noopener,noreferrer");
				return;
			}
			setFailed(null);
			setAppMissing(null);
			setConnecting(w.id);
			const result = await connect(w.id, role);
			setConnecting(null);
			if (result === "missing") setFailed(w.id);
			else if (result) router.push(redirectTo);
			return;
		}
		if (stateOf(w) === "ready") {
			setFailed(null);
			setFlow({ wallet: w.id, startAt: 3 });
		} else if (w.id === "freighter") {
			setFailed("freighter");
		} else {
			window.open(w.installUrl, "_blank", "noopener,noreferrer");
			toast.info(`Install ${w.name} to continue`, {
				description: "This demo simulates Freighter's setup — try it, or use xBull or Albedo.",
			});
		}
	};

	return (
		<aside className={cn("rounded-[var(--radius-xl)] border border-line bg-surface/90 p-5 backdrop-blur-md sm:p-8", className)}>
			<div className="flex items-start gap-4">
				<IconTile size="lg">
					<Wallet />
				</IconTile>
				<div>
					<h2 className="font-display text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">Connect your wallet</h2>
					<p className="mt-1 text-sm text-muted">Your Stellar wallet is your Boluck account — no email or password.</p>
				</div>
			</div>

			{hydrated && wallet ? (
				<div className="mt-8 animate-fade-up space-y-4">
					<div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-primary/60 bg-deep/50 p-4">
						<CircleCheck className="size-5 text-primary" />
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-ink">Connected with {walletName(wallet.provider)}</p>
							<p className="truncate text-xs text-muted">
								{!LIVE && ACCOUNT_NAMES[wallet.address] ? `${ACCOUNT_NAMES[wallet.address]} · ` : ""}
								{shortAddress(wallet.address)}
							</p>
						</div>
					</div>
					<ButtonLink href={redirectTo} size="lg" fullWidth iconRight={<ArrowRight />}>
						Go to your workspace
					</ButtonLink>
					<Button variant="ghost" fullWidth onClick={disconnect}>
						Use a different wallet
					</Button>
				</div>
			) : (
				<>
					{LIVE && picked && (
						<div className="mt-8 animate-fade-up rounded-[var(--radius-md)] border border-primary/60 bg-deep/40 p-4">
							<Button
								fullWidth
								size="lg"
								loading={connecting === picked}
								loadingText="Check your wallet…"
								disabled={!!connecting}
								onClick={() => void choose(WALLETS.find((w) => w.id === picked)!)}
								iconRight={<ArrowRight />}
							>
								Continue with {walletName(picked)} as {role}
							</Button>
							<p className="mt-2 text-center text-[10px] text-muted">
								Your wallet asks you to sign a sign-in request. It moves no funds.
							</p>
						</div>
					)}
					<h3 className="mt-8 font-display text-base font-bold text-ink">1 · How will you use Boluck?</h3>
					<div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4" role="radiogroup" aria-label="Role">
						{ROLES.map((r) => {
							const selected = role === r.id;
							const Icon = r.icon;
							return (
								<button
									key={r.id}
									role="radio"
									aria-checked={selected}
									onClick={() => setRole(r.id)}
									className={cn(
										"relative rounded-[var(--radius-md)] border p-4 text-left transition-all duration-200",
										selected ? "border-review bg-review/10" : "border-line bg-canvas/40 hover:border-subtle",
									)}
								>
									<Icon className={cn("size-4", selected ? "text-review" : "text-muted")} />
									{selected && <CircleCheck className="absolute top-4 right-4 size-4 animate-pop-in fill-review text-surface" />}
									<span className="mt-4 block text-sm font-semibold text-ink">{r.label}</span>
									<span className="mt-0.5 block text-[10px] text-muted">{r.sub}</span>
								</button>
							);
						})}
					</div>

					<h3 className="mt-8 font-display text-base font-bold text-ink">2 · Choose a Stellar wallet</h3>
					<ul className="stagger mt-4 space-y-3">
						{shown.map((w) => {
							const ready = stateOf(w) === "ready";
							return (
								<li key={w.id}>
									<button
										onClick={() => void choose(w)}
										disabled={!!connecting}
										aria-busy={connecting === w.id}
										className={cn(
											"group flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all duration-200 hover:-translate-y-px disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0",
											w.recommended || picked === w.id
												? "border-primary bg-deep/50 hover:bg-deep/70"
												: "border-line bg-canvas/40 hover:border-subtle",
										)}
									>
										<span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-line bg-elevated text-sm font-semibold text-ink">
											{w.name[0]}
										</span>
										<span className="min-w-0 flex-1">
											<span className="flex items-center gap-2 text-sm font-semibold text-ink">
												{w.name}
												{w.recommended && (
													<span className="rounded-full bg-review/20 px-1.5 py-0.5 text-[7px] font-semibold tracking-wide text-review uppercase">
														Recommended
													</span>
												)}
											</span>
											<span className="block text-[10px] text-muted">{w.kind}</span>
										</span>
										{connecting === w.id ? (
											<span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
												<Spinner className="size-3.5" /> Check your wallet
											</span>
										) : ready ? (
											<span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
												<span className="size-1.5 rounded-full bg-primary" />{" "}
												{!LIVE
													? "Ready"
													: w.id === "albedo"
														? "Web"
														: w.id === "varial_mobile"
															? device.inApp
																? "In the app"
																: device.phone
																	? "Opens the app"
																	: "QR code"
															: "Detected"}
											</span>
										) : LIVE && w.id === "freighter" ? (
											<span className="flex items-center gap-1 text-[10px] text-muted transition-colors group-hover:text-ink">
												Not detected · try anyway
											</span>
										) : (
											<span className="flex items-center gap-1 text-xs text-muted transition-colors group-hover:text-ink">
												Install <ExternalLink className="size-3" />
											</span>
										)}
									</button>
								</li>
							);
						})}
					</ul>

					{LIVE && appMissing && (
						<div className="mt-5 animate-pop-in rounded-[var(--radius-md)] border border-review/70 bg-review/10 p-5" role="alert">
							<p className="flex items-center gap-2 text-sm font-semibold text-ink">
								<AlertTriangle className="size-4 text-review" /> Varial didn&apos;t open
							</p>
							<p className="mt-2 text-[10px] leading-relaxed text-muted sm:text-xs">
								Install the Varial app (listed as Freighter in the stores), set it to Testnet, then try again.
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
								<a
									href={device.store}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 font-semibold text-review hover:underline"
								>
									Get Varial <ExternalLink className="size-3" />
								</a>
								<button onClick={appMissing.retry} className="font-semibold text-primary hover:underline">
									Open Varial again
								</button>
							</div>
						</div>
					)}

					{LIVE && failed && failed !== "varial_mobile" && (
						<div
							className="mt-5 animate-pop-in rounded-[var(--radius-md)] border border-attention/80 bg-attention/10 p-5"
							role="alert"
						>
							<p className="flex items-center gap-2 text-sm font-semibold text-ink">
								<AlertTriangle className="size-4 text-attention" /> Couldn&apos;t reach {walletName(failed)}
							</p>
							<p className="mt-2 text-[10px] leading-relaxed text-muted sm:text-xs">
								{failed === "freighter"
									? "The Varial extension didn't answer. Install it (the Chrome Web Store still lists it as Freighter), or make sure it's enabled and unlocked, then reload this page."
									: `${walletName(failed)} didn't answer. Install or unlock it, then reload this page.`}
							</p>
							<div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
								<a
									href={WALLETS.find((w) => w.id === failed)?.installUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 font-semibold text-review hover:underline"
								>
									Install <ExternalLink className="size-3" />
								</a>
								{failed === "freighter" && (
									<button
										onClick={() => void choose(WALLETS.find((w) => w.id === "varial_mobile")!)}
										className="font-semibold text-primary hover:underline"
									>
										Use Varial Mobile instead
									</button>
								)}
								<button onClick={() => setFailed(null)} className="text-muted hover:text-ink">
									Dismiss
								</button>
							</div>
						</div>
					)}

					{!LIVE && failed === "freighter" && (
						<div
							className="mt-5 animate-pop-in rounded-[var(--radius-md)] border border-attention/80 bg-attention/10 p-5"
							role="alert"
						>
							<p className="flex items-center gap-2 text-sm font-semibold text-ink">
								<AlertTriangle className="size-4 text-attention" /> Couldn&apos;t connect Varial
							</p>
							<p className="mt-2 text-[10px] leading-relaxed text-muted sm:text-xs">
								Varial (formerly Freighter) doesn&apos;t seem to be installed in this browser.
							</p>
							<div className="mt-3 flex items-center gap-4 text-xs">
								{
									<button
										onClick={() => {
											setFailed(null);
											setFlow({ wallet: "freighter", startAt: 0 });
										}}
										className="inline-flex items-center gap-1 font-semibold text-review hover:underline"
									>
										Install <ExternalLink className="size-3" />
									</button>
								}
								<button onClick={() => setFailed(null)} className="text-muted hover:text-ink">
									Dismiss
								</button>
							</div>
						</div>
					)}

					<div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-line p-4 sm:p-5">
						<p className="font-display text-sm font-bold text-ink">New to Stellar? Get set up in 3 steps</p>
						<ol className="mt-4 space-y-4">
							{[
								{
									t: device.phone ? "Install the Varial app" : "Install Varial",
									s: device.phone
										? "A free Stellar wallet (formerly Freighter)."
										: "A free browser wallet for Stellar (formerly Freighter).",
									cta: "Get Varial",
									href: device.phone ? device.store : VARIAL_STORES.extension,
								},
								{
									t: "Switch to Testnet",
									s: "In Varial's settings, choose “Test Net”.",
									cta: "How to",
									href: "https://developers.stellar.org/docs/build/guides/freighter/connect-testnet",
								},
								{
									t: "Fund your test account",
									s: "Get free test XLM from Friendbot.",
									cta: "Open Friendbot",
									href: "https://lab.stellar.org/account/fund",
								},
							].map((item, i) => (
								<li key={item.t} className="flex items-start gap-3">
									<span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-[10px] text-muted">
										{i + 1}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block text-xs font-semibold text-ink">{item.t}</span>
										<span className="block text-[10px] text-muted">{item.s}</span>
									</span>
									<a
										href={item.href}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
									>
										{item.cta} <ExternalLink className="size-3" />
									</a>
								</li>
							))}
						</ol>
					</div>
				</>
			)}

			<p className="mt-6 text-center text-[10px] text-muted">
				Boluck never holds your keys. Every action is signed in your own wallet.
			</p>

			{flow && (
				<WalletFlowModal
					open
					wallet={flow.wallet}
					role={role}
					startAt={flow.startAt}
					onClose={() => setFlow(null)}
					onConnected={async () => {
						setInstalled((list) => [...new Set([...list, flow.wallet])]);
						await connect(flow.wallet, role);
						setFlow(null);
						router.push(redirectTo);
					}}
				/>
			)}
		</aside>
	);
}
