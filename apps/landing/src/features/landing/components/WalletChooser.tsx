"use client";

import { AlertTriangle, BriefcaseBusiness, CircleCheck, ExternalLink, PenTool, Wallet } from "lucide-react";
import { useState } from "react";
import type { Role } from "@repo/stellar/bounty";
import { IconTile } from "@repo/ui/panel";
import { cn } from "@repo/ui/lib/utils";
import { APP_LINKS } from "@/lib/site";

const ROLES: { id: Role; label: string; sub: string; icon: typeof BriefcaseBusiness }[] = [
	{ id: "issuer", label: "Issuer", sub: "Post & fund bounties", icon: BriefcaseBusiness },
	{ id: "contributor", label: "Contributor", sub: "Do the work & get paid", icon: PenTool },
];

/** In this demo Freighter is "not installed" (setup walkthrough); xBull and Albedo are "ready". */
const WALLETS = [
	{ id: "freighter", name: "Freighter", kind: "Extension", ready: false, recommended: true, url: "https://www.freighter.app/" },
	{ id: "xbull", name: "xBull", kind: "Extension & mobile", ready: true, url: "https://xbull.app/" },
	{ id: "albedo", name: "Albedo", kind: "Web", ready: true, url: "https://albedo.link/" },
	{ id: "lobstr", name: "LOBSTR", kind: "Extension & mobile", ready: false, url: "https://lobstr.co/" },
	{ id: "rabet", name: "Rabet", kind: "Extension", ready: false, url: "https://rabet.io/" },
	{ id: "hana", name: "Hana", kind: "Extension", ready: false, url: "https://www.hanawallet.io/" },
];

const SETUP = [
	{ t: "Install Freighter", s: "A free browser wallet for Stellar.", cta: "Get Freighter", href: "https://www.freighter.app/" },
	{
		t: "Switch to Testnet",
		s: "In Freighter settings, choose “Test Net”.",
		cta: "How to",
		href: "https://developers.stellar.org/docs/build/guides/freighter/connect-testnet",
	},
	{
		t: "Fund your test account",
		s: "Get free test XLM from Friendbot.",
		cta: "Open Friendbot",
		href: "https://lab.stellar.org/account/fund",
	},
];

/**
 * "Connect your wallet" panel from the landing design. Choosing a ready wallet hands off to the app's /connect
 * page (a different app, so plain links) with the role and wallet; the app finishes the connection.
 */
export function WalletChooser({ className }: { className?: string }) {
	const [role, setRole] = useState<Role>("issuer");
	const [failed, setFailed] = useState(false);

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
				{WALLETS.map((w) => {
					const classes = cn(
						"group flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left transition-all duration-200 hover:-translate-y-px",
						w.recommended ? "border-primary bg-deep/50 hover:bg-deep/70" : "border-line bg-canvas/40 hover:border-subtle",
					);
					const body = (
						<>
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
							{w.ready ? (
								<span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
									<span className="size-1.5 rounded-full bg-primary" /> Ready
								</span>
							) : (
								<span className="flex items-center gap-1 text-xs text-muted transition-colors group-hover:text-ink">
									Install <ExternalLink className="size-3" />
								</span>
							)}
						</>
					);
					return (
						<li key={w.id}>
							{w.ready ? (
								<a href={APP_LINKS.connect({ role, wallet: w.id })} className={classes}>
									{body}
								</a>
							) : w.id === "freighter" ? (
								<button onClick={() => setFailed(true)} className={classes}>
									{body}
								</button>
							) : (
								<a href={w.url} target="_blank" rel="noreferrer" className={classes}>
									{body}
								</a>
							)}
						</li>
					);
				})}
			</ul>

			{failed && (
				<div
					className="mt-5 animate-pop-in rounded-[var(--radius-md)] border border-attention/80 bg-attention/10 p-5"
					role="alert"
				>
					<p className="flex items-center gap-2 text-sm font-semibold text-ink">
						<AlertTriangle className="size-4 text-attention" /> Couldn&apos;t connect Freighter
					</p>
					<p className="mt-2 text-[10px] leading-relaxed text-muted sm:text-xs">
						Freighter doesn&apos;t seem to be installed in this browser.
					</p>
					<div className="mt-3 flex items-center gap-4 text-xs">
						<a
							href={APP_LINKS.connect({ role, wallet: "freighter", setup: "1" })}
							className="inline-flex items-center gap-1 font-semibold text-review hover:underline"
						>
							Install <ExternalLink className="size-3" />
						</a>
						<button onClick={() => setFailed(false)} className="text-muted hover:text-ink">
							Dismiss
						</button>
					</div>
				</div>
			)}

			<div className="mt-5 rounded-[var(--radius-md)] border border-dashed border-line p-4 sm:p-5">
				<p className="font-display text-sm font-bold text-ink">New to Stellar? Get set up in 3 steps</p>
				<ol className="mt-4 space-y-4">
					{SETUP.map((item, i) => (
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
								rel="noreferrer"
								className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
							>
								{item.cta} <ExternalLink className="size-3" />
							</a>
						</li>
					))}
				</ol>
			</div>

			<p className="mt-6 text-center text-[10px] text-muted">
				Boluck never holds your keys. Every action is signed in your own wallet.
			</p>
		</aside>
	);
}
