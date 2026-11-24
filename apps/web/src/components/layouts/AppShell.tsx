"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Logo } from "@repo/ui/brand";
import { Skeleton } from "@repo/ui/misc";
import { ConnectPanel } from "@/features/wallet/components/ConnectPanel";
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { TxDialog } from "@/features/wallet/components/TxDialog";
import { useClickOutside, WalletButton } from "@/components/layouts/WalletMenu";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { NotificationsButton } from "./NotificationsBell";
import { PathSidebarNav, SidebarBody, SidebarNavFallback } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
	const [drawer, setDrawer] = useState(false);
	const close = () => setDrawer(false);

	return (
		<div className="flex min-h-dvh">
			<StoreHydrator />

			{/* Desktop sidebar */}
			<aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 3xl:w-[300px] flex-col border-r border-line bg-surface lg:flex">
				<SidebarBody
					nav={
						<Suspense fallback={<SidebarNavFallback />}>
							<PathSidebarNav />
						</Suspense>
					}
				/>
			</aside>

			{/* Mobile drawer */}
			<div
				className={cn("fixed inset-0 z-50 lg:hidden", drawer ? "pointer-events-auto" : "pointer-events-none")}
				aria-hidden={!drawer}
			>
				<div
					className={cn(
						"absolute inset-0 bg-canvas/70 backdrop-blur-sm transition-opacity duration-300",
						drawer ? "opacity-100" : "opacity-0",
					)}
					onClick={close}
				/>
				<aside
					className={cn(
						"absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col border-r border-line bg-surface transition-transform duration-300 ease-out",
						drawer ? "translate-x-0" : "-translate-x-full",
					)}
				>
					<button
						onClick={close}
						className="absolute top-8 right-4 z-10 rounded-md p-1.5 text-muted hover:text-ink"
						aria-label="Close menu"
					>
						<X className="size-5" />
					</button>
					{drawer && (
						<SidebarBody
							onNavigate={close}
							nav={
								<Suspense fallback={<SidebarNavFallback />}>
									<PathSidebarNav onNavigate={close} />
								</Suspense>
							}
						/>
					)}
				</aside>
			</div>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6 lg:h-20 lg:px-10">
					<button
						onClick={() => setDrawer(true)}
						className="-ml-1 rounded-md p-2 text-ink hover:bg-elevated lg:hidden"
						aria-label="Open menu"
					>
						<Menu className="size-5" />
					</button>
					<Logo href="/overview" size="sm" className="lg:hidden" />
					<Suspense fallback={<span className="hidden flex-1 lg:block" />}>
						<Breadcrumbs />
					</Suspense>
					<span className="flex-1 lg:hidden" />
					<HeaderControls />
				</header>

				<main className="flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-10 lg:pt-8">
					<div className="mx-auto w-full max-w-[1080px] min-[1600px]:max-w-[1240px] min-[2000px]:max-w-[1440px] 4xl:max-w-[1640px]">
						<Gate>{children}</Gate>
					</div>
				</main>
				<footer className="mx-4 border-t border-line py-6 text-[10px] text-muted sm:mx-6 lg:mx-10">
					© 2026 Boluck · A clear deal. A funded promise.
				</footer>
			</div>

			<TxDialog />
		</div>
	);
}

const CRUMBS: [RegExp, string[]][] = [
	[/^\/overview/, ["Overview"]],
	[/^\/bounties\/new/, ["Create a bounty"]],
	[/^\/bounties\/[^/]+\/fund/, ["Fund bounty"]],
	[/^\/bounties\/[^/]+\/submit/, ["Submit work"]],
	[/^\/bounties\/[^/]+\/review/, ["Review work"]],
	[/^\/bounties\/[^/]+/, ["Explore bounties", "Bounty details"]],
	[/^\/bounties/, ["Explore bounties"]],
	[/^\/history/, ["Payment history"]],
	[/^\/refunds/, ["Refunds & safety"]],
	[/^\/settings/, ["Demo settings"]],
];

function Breadcrumbs() {
	const pathname = usePathname();
	const trail = CRUMBS.find(([re]) => re.test(pathname))?.[1] ?? [];
	return (
		<nav aria-label="Breadcrumb" className="hidden flex-1 items-center gap-1.5 text-sm lg:flex lg:text-[15px]">
			<Link href="/overview" className="text-muted transition-colors hover:text-ink">
				Workspace
			</Link>
			{trail.map((c, i) => (
				<span key={c} className="flex items-center gap-1.5">
					<span className="text-muted">/</span>
					{i === trail.length - 1 ? (
						<span className="font-medium text-ink" aria-current="page">
							{c}
						</span>
					) : (
						<Link href="/bounties" className="text-muted transition-colors hover:text-ink">
							{c}
						</Link>
					)}
				</span>
			))}
		</nav>
	);
}

function NetworkPill() {
	const [open, setOpen] = useState(false);
	const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
	return (
		<div className="relative hidden sm:block" ref={ref}>
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-line px-2.5 text-[10px] text-ink transition-colors hover:border-subtle"
			>
				<span className="size-1.5 rounded-full bg-primary" /> Stellar Testnet <ChevronDown className="size-3 text-muted" />
			</button>
			{open && (
				<div className="absolute right-0 z-40 mt-2 w-56 animate-pop-in rounded-[var(--radius-md)] border border-line bg-surface p-3 text-xs shadow-[var(--shadow-pop)]">
					<p className="font-semibold text-ink">Stellar Testnet</p>
					<p className="mt-1 text-muted">Boluck uses testnet USDC. No real funds are ever moved. Mainnet comes after the MVP.</p>
				</div>
			)}
		</div>
	);
}

function HeaderControls() {
	const hydrated = useAppStore((s) => s.hydrated);
	const wallet = useAppStore((s) => s.wallet);
	if (!hydrated) return <Skeleton className="h-8 w-40" />;
	return (
		<div className="flex items-center gap-2 sm:gap-4">
			<NetworkPill />
			{wallet && <NotificationsButton />}
			<WalletButton />
		</div>
	);
}

/** Waits for persisted state, then requires a connected wallet. */
function Gate({ children }: { children: ReactNode }) {
	const hydrated = useAppStore((s) => s.hydrated);
	const wallet = useAppStore((s) => s.wallet);

	if (!hydrated) return <PageSkeleton />;

	if (!wallet) {
		return (
			<div className="mx-auto max-w-xl animate-fade-up py-4">
				<p className="text-sm font-semibold text-primary uppercase">Wallet required</p>
				<h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.02em]">Connect to open your workspace.</h1>
				<p className="mt-2 mb-8 text-muted">Bounties, escrow and payouts are tied to your Stellar wallet.</p>
				<Suspense fallback={<Skeleton className="h-[600px]" />}>
					<GateConnect />
				</Suspense>
			</div>
		);
	}

	return <>{children}</>;
}

function GateConnect() {
	const pathname = usePathname();
	return <ConnectPanel redirectTo={pathname} />;
}

export function PageSkeleton() {
	return (
		<div className="space-y-6" aria-busy aria-label="Loading">
			<Skeleton className="h-4 w-48" />
			<Skeleton className="h-10 w-2/3" />
			<Skeleton className="h-4 w-1/2" />
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-36" />
				))}
			</div>
			<Skeleton className="h-72" />
		</div>
	);
}
