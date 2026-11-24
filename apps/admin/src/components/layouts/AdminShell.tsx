"use client";

import { Activity, ArrowLeftRight, FolderKanban, LayoutDashboard, LogOut, Menu, ServerCog, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { shortAddress } from "@repo/stellar/format";
import { Logo } from "@repo/ui/brand";
import { cn } from "@repo/ui/lib/utils";
import { useAuth } from "@/features/auth/store";
import { APP_URL } from "@/lib/site";

const NAV = [
	{ href: "/", label: "Overview", icon: LayoutDashboard },
	{ href: "/bounties", label: "Bounties", icon: FolderKanban },
	{ href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
	{ href: "/wallets", label: "Wallets", icon: Wallet },
	{ href: "/system", label: "System", icon: ServerCog },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
	const pathname = usePathname();
	return (
		<nav aria-label="Console" className="space-y-1">
			{NAV.map(({ href, label, icon: Icon }) => {
				const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
				return (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						aria-current={active ? "page" : undefined}
						className={cn(
							"relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors",
							active ? "bg-elevated font-semibold text-primary" : "text-ink hover:bg-elevated/60",
						)}
					>
						{active && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
						<Icon className="size-4 shrink-0" /> {label}
					</Link>
				);
			})}
		</nav>
	);
}

function Account() {
	const wallet = useAuth((s) => s.wallet);
	const signOut = useAuth((s) => s.signOut);
	return (
		<div className="flex items-center gap-3 border-t border-line p-4">
			<span className="grid size-9 shrink-0 place-items-center rounded-full bg-deep text-primary">
				<Activity className="size-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate font-mono text-xs text-ink">{shortAddress(wallet?.address)}</span>
				<span className="block text-[10px] text-muted">Admin · Testnet</span>
			</span>
			<button
				onClick={() => signOut()}
				className="rounded-[var(--radius-sm)] p-2 text-muted transition-colors hover:bg-elevated hover:text-ink"
				aria-label="Sign out"
				title="Sign out"
			>
				<LogOut className="size-4" />
			</button>
		</div>
	);
}

/** Console chrome: sidebar on desktop, top bar + drawer on small screens. */
export function AdminShell({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="flex min-h-dvh">
			<aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
				<div className="flex h-16 items-center gap-2 border-b border-line px-5">
					<Logo href="/" size="sm" />
					<span className="text-[10px] font-semibold tracking-wide text-muted uppercase">Admin</span>
				</div>
				<div className="flex-1 overflow-y-auto p-3">
					<Nav />
				</div>
				<a
					href={APP_URL}
					className="mx-3 mb-3 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-muted hover:bg-elevated hover:text-ink"
				>
					Open the Boluck app →
				</a>
				<Account />
			</aside>

			{open && (
				<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Menu">
					<button
						className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
						aria-label="Close menu"
						onClick={() => setOpen(false)}
					/>
					<div className="absolute inset-y-0 left-0 flex w-[min(17rem,85vw)] animate-slide-in-left flex-col border-r border-line bg-surface">
						<div className="flex h-14 items-center justify-between border-b border-line px-4">
							<Logo href="/" size="sm" />
							<button onClick={() => setOpen(false)} className="p-2 text-muted hover:text-ink" aria-label="Close menu">
								<X className="size-5" />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-3">
							<Nav onNavigate={() => setOpen(false)} />
						</div>
						<Account />
					</div>
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-canvas/90 px-3 backdrop-blur-md lg:hidden">
					<button onClick={() => setOpen(true)} className="p-2 text-ink" aria-label="Open menu">
						<Menu className="size-5" />
					</button>
					<Logo href="/" size="sm" />
					<span className="w-9 text-[9px] font-semibold text-muted uppercase">Admin</span>
				</header>
				<main className="min-w-0 flex-1 px-3 py-6 min-[360px]:px-4 sm:px-6 lg:px-10 lg:py-8">
					<div className="mx-auto w-full max-w-[1200px] min-w-0">{children}</div>
				</main>
			</div>
		</div>
	);
}
