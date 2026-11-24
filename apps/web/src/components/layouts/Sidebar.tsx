"use client";

import {
	Check,
	ChevronDown,
	FilePlus2,
	FolderOpen,
	History,
	LayoutGrid,
	Lock,
	LogOut,
	MoreHorizontal,
	Plus,
	Settings,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@repo/ui/brand";
import { IconTile } from "@repo/ui/panel";
import { useClickOutside } from "@/components/layouts/WalletMenu";
import { ACTIVE_STATUSES } from "@repo/stellar/status";
import { formatUsd } from "@repo/stellar/format";
import { DEMO_ACCOUNTS } from "@/lib/api/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { useRoleBounties } from "@/features/escrow/hooks";

export const NAV = [
	{
		section: "Workspace",
		items: [
			{ href: "/overview", label: "Overview", icon: LayoutGrid },
			{ href: "/bounties", label: "Explore Bounties", icon: FolderOpen },
			{ href: "/bounties/new", label: "Create a bounty", icon: FilePlus2, plus: true },
		],
	},
	{
		section: "Manage",
		items: [
			{ href: "/history", label: "Payment history", icon: History },
			{ href: "/refunds", label: "Refunds & safety", icon: ShieldCheck },
		],
	},
] as const;

function isActive(pathname: string, href: string) {
	if (href === "/bounties")
		return pathname === href || (pathname.startsWith("/bounties/") && !pathname.startsWith("/bounties/new"));
	return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string }) {
	return (
		<nav aria-label="App" className="space-y-8">
			{NAV.map((group) => (
				<div key={group.section}>
					<p className="px-4 text-xs font-medium tracking-wide text-ink uppercase">{group.section}</p>
					<ul className="mt-4 space-y-1.5">
						{group.items.map((item, i) => {
							const active = isActive(pathname, item.href);
							const Icon = item.icon;
							return (
								<li key={item.href} className="animate-slide-in-left" style={{ animationDelay: `${i * 50}ms` }}>
									<Link
										href={item.href}
										onClick={onNavigate}
										aria-current={active ? "page" : undefined}
										className={cn(
											"group relative flex h-12 items-center gap-3 rounded-[var(--radius-sm)] px-4 text-sm font-medium transition-colors",
											active ? "bg-elevated text-primary" : "text-ink hover:bg-elevated/60",
										)}
									>
										{active && (
											<span className="absolute inset-y-3 left-0 w-0.5 animate-fade-in rounded-full bg-primary" aria-hidden />
										)}
										<Icon className="size-4 shrink-0" aria-hidden />
										<span className="flex-1">{item.label}</span>
										{"plus" in item && (
											<span className="grid size-5 place-items-center rounded-full bg-primary/20 text-primary transition-transform group-hover:rotate-90">
												<Plus className="size-3" />
											</span>
										)}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}

/** Static nav used as the Suspense fallback while the pathname resolves. */
export function SidebarNavFallback() {
	return <SidebarNav pathname="" />;
}

export function PathSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	return <SidebarNav pathname={pathname} onNavigate={onNavigate} />;
}

export function WorkspaceSwitcher() {
	const [open, setOpen] = useState(false);
	const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="flex w-full items-center gap-3 rounded-[var(--radius-md)] bg-elevated p-4 text-left transition-colors hover:bg-elevated/80"
			>
				<IconTile size="lg">
					<Lock />
				</IconTile>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-xs font-semibold text-ink">Stellar workspace</span>
					<span className="block text-[10px] text-muted">Testnet · USDC</span>
				</span>
				<ChevronDown className={cn("size-5 text-muted transition-transform", open && "rotate-180")} />
			</button>
			{open && (
				<div className="absolute inset-x-0 z-30 mt-2 animate-pop-in rounded-[var(--radius-md)] border border-line bg-surface p-1.5 text-sm shadow-[var(--shadow-pop)]">
					<p className="px-3 pt-2 pb-1 text-[10px] tracking-wide text-muted uppercase">Network</p>
					<span className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-ink">
						Stellar Testnet <Check className="size-4 text-primary" />
					</span>
					<span className="flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-subtle">
						Stellar Mainnet <span className="text-[10px]">After MVP</span>
					</span>
					<div className="my-1 h-px bg-line" />
					<Link
						href="/settings"
						onClick={() => setOpen(false)}
						className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-muted hover:bg-elevated hover:text-ink"
					>
						<Settings className="size-4" /> Demo settings
					</Link>
				</div>
			)}
		</div>
	);
}

export function YourWork({ onNavigate }: { onNavigate?: () => void }) {
	const bounties = useRoleBounties().filter((b) => ACTIVE_STATUSES.includes(b.status) && b.status !== "funded");
	return (
		<div>
			<div className="flex items-center justify-between px-4">
				<p className="text-xs font-medium tracking-wide text-ink uppercase">Your work</p>
				<Link
					href="/bounties"
					onClick={onNavigate}
					aria-label="See all bounties"
					className="rounded p-0.5 text-muted hover:text-ink"
				>
					<MoreHorizontal className="size-4" />
				</Link>
			</div>
			{bounties.length === 0 ? (
				<p className="mt-4 px-4 text-[11px] text-muted">Nothing in flight right now.</p>
			) : (
				<ul className="mt-4 space-y-1">
					{bounties.slice(0, 4).map((b) => (
						<li key={b.id}>
							<Link
								href={`/bounties/${b.id}`}
								onClick={onNavigate}
								className="flex items-start gap-3 rounded-[var(--radius-sm)] px-4 py-2 transition-colors hover:bg-elevated/60"
							>
								<span
									className={cn("mt-2 size-1.5 shrink-0 rounded-full", b.status === "submitted" ? "bg-review" : "bg-active")}
									aria-hidden
								/>
								<span className="min-w-0">
									<span className="block truncate text-sm font-medium text-ink">{b.title}</span>
									<span className="block text-[10px] text-muted">
										{b.id} · {formatUsd(b.rewardAmount)}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export function AccountFooter() {
	const router = useRouter();
	const role = useAppStore((s) => s.role);
	const wallet = useAppStore((s) => s.wallet);
	const disconnect = useAppStore((s) => s.disconnect);
	const account = DEMO_ACCOUNTS[role];
	if (!wallet) return null;
	return (
		<div className="flex items-center gap-3 border-t border-line px-6 py-6">
			<span className="grid size-10 shrink-0 place-items-center rounded-full bg-deep font-display text-base font-bold text-primary">
				{account.initials}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-medium text-ink">{account.name}</span>
				<span className="block text-[10px] text-muted">Testnet wallet</span>
			</span>
			<button
				onClick={() => {
					disconnect();
					router.push("/");
				}}
				className="rounded-[var(--radius-sm)] p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
				aria-label="Disconnect wallet"
				title="Disconnect"
			>
				<LogOut className="size-5" />
			</button>
		</div>
	);
}

export function SidebarBody({ onNavigate, nav }: { onNavigate?: () => void; nav: React.ReactNode }) {
	return (
		<>
			<div className="flex h-24 shrink-0 items-center border-b border-line px-5">
				<Logo href="/overview" />
			</div>
			<div className="flex-1 space-y-8 overflow-y-auto px-4 py-8">
				<WorkspaceSwitcher />
				{nav}
				<div className="h-px bg-line" />
				<YourWork onNavigate={onNavigate} />
			</div>
			<AccountFooter />
		</>
	);
}
