"use client";

import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Role, WalletId } from "@repo/stellar/bounty";
import { Logo } from "@repo/ui/brand";
import { StoreHydrator } from "@/components/providers/StoreHydrator";
import { LANDING_URL } from "@/lib/site";
import { WALLETS } from "../wallets";
import { ConnectPanel } from "./ConnectPanel";

/** Full-page wallet connection, reached from the landing site or when a session ends. */
export function ConnectScreen() {
	const params = useSearchParams();
	const role: Role = params.get("role") === "contributor" ? "contributor" : "issuer";
	const walletParam = params.get("wallet");
	const wallet = WALLETS.find((w) => w.id === walletParam)?.id as WalletId | undefined;
	// Only accept same-app paths as the redirect target.
	const next = params.get("next");
	const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/overview";
	const autoStart = wallet ? { wallet, startAt: wallet === "freighter" && params.get("setup") ? 0 : 3 } : undefined;

	return (
		<div className="relative isolate flex min-h-dvh flex-col">
			<StoreHydrator />
			<div
				className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgb(27_67_50/0.45),transparent_60%)]"
				aria-hidden
			/>
			<header className="container-page flex h-20 items-center justify-between">
				<Logo href="/overview" />
				<a href={LANDING_URL} className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
					<ArrowLeft className="size-4" /> Back to site
				</a>
			</header>
			<main className="container-page grid flex-1 place-items-center py-8">
				<div className="w-full max-w-[440px] animate-fade-up">
					<ConnectPanel redirectTo={redirectTo} initialRole={role} autoStart={autoStart} />
				</div>
			</main>
		</div>
	);
}
