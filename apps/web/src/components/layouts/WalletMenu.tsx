"use client";

import { Copy, ExternalLink, LogOut, Settings, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { explorerAccountUrl } from "@repo/stellar/network";
import { walletName } from "@/features/wallet/wallets";
import { formatAmount, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES } from "@/lib/api/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore, useWalletBalance } from "@/features/escrow/store";
import { toast } from "@repo/ui/toast";

/** Mint wallet pill in the top bar ("GC6X…8QJP") with an account menu. */
export function WalletButton() {
	const router = useRouter();
	const wallet = useAppStore((s) => s.wallet);
	const disconnect = useAppStore((s) => s.disconnect);
	const balance = useWalletBalance();
	const [open, setOpen] = useState(false);
	const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

	if (!wallet) return null;

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="menu"
				className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-2.5 text-xs font-semibold text-on-primary transition-all hover:bg-primary-strong active:scale-[0.98] sm:px-3"
			>
				<Wallet className="size-4" />
				<span className="hidden sm:inline">{shortAddress(wallet.address)}</span>
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 z-40 mt-2 w-72 animate-pop-in rounded-[var(--radius-lg)] border border-line bg-surface p-2 shadow-[var(--shadow-pop)]"
				>
					<div className="px-3 py-2.5">
						<p className="text-[10px] text-muted">Connected with {walletName(wallet.provider)} · Testnet</p>
						<p className="mt-1 text-sm font-semibold text-ink">{ACCOUNT_NAMES[wallet.address] ?? "Testnet account"}</p>
						<p className="mt-0.5 font-mono text-[10px] break-all text-muted">{wallet.address}</p>
					</div>
					<div className="mx-1 grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-canvas/60 p-3 text-sm">
						<div>
							<p className="text-[10px] text-muted">USDC</p>
							<p className="font-semibold text-ink tabular-nums">{formatAmount(balance?.usdc ?? 0, "")}</p>
						</div>
						<div>
							<p className="text-[10px] text-muted">XLM</p>
							<p className="font-semibold text-ink tabular-nums">{formatAmount(balance?.xlm ?? 0, "")}</p>
						</div>
					</div>
					<div className="mt-1 flex flex-col">
						<MenuItem
							icon={<Copy />}
							onClick={() => {
								navigator.clipboard?.writeText(wallet.address).then(() => toast.success("Address copied"));
								setOpen(false);
							}}
						>
							Copy address
						</MenuItem>
						<a href={explorerAccountUrl(wallet.address)} target="_blank" rel="noreferrer" className={itemClass} role="menuitem">
							<ExternalLink /> View on Stellar Expert
						</a>
						<Link href="/settings" onClick={() => setOpen(false)} className={itemClass} role="menuitem">
							<Settings /> Demo settings
						</Link>
						<MenuItem
							icon={<LogOut />}
							danger
							onClick={() => {
								setOpen(false);
								disconnect();
								router.push("/");
							}}
						>
							Disconnect
						</MenuItem>
					</div>
				</div>
			)}
		</div>
	);
}

const itemClass =
	"flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-elevated hover:text-ink [&>svg]:size-4";

function MenuItem({
	icon,
	children,
	onClick,
	danger,
}: {
	icon: ReactNode;
	children: ReactNode;
	onClick: () => void;
	danger?: boolean;
}) {
	return (
		<button onClick={onClick} role="menuitem" className={cn(itemClass, danger && "text-attention hover:text-attention")}>
			{icon}
			{children}
		</button>
	);
}

export function useClickOutside<T extends HTMLElement>(active: boolean, onOutside: () => void) {
	const ref = useRef<T>(null);
	useEffect(() => {
		if (!active) return;
		const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onOutside();
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [active, onOutside]);
	return ref;
}
