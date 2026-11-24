"use client";

import { FlaskConical, RotateCcw, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@repo/ui/button";
import { DetailRows, Panel } from "@repo/ui/panel";
import { RoleToggle } from "@/features/overview/Overview";
import { NETWORK_LABEL } from "@repo/stellar/network";
import { API_URL, LIVE } from "@/lib/api/config";
import { walletName } from "@/features/wallet/wallets";
import { formatAmount, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES, DEMO_ACCOUNTS } from "@/lib/api/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore, useWalletBalance } from "@/features/escrow/store";

export function SettingsView() {
	const wallet = useAppStore((s) => s.wallet);
	const simulateFailures = useAppStore((s) => s.simulateFailures);
	const setSimulateFailures = useAppStore((s) => s.setSimulateFailures);
	const resetDemo = useAppStore((s) => s.resetDemo);
	const balance = useWalletBalance();
	const config = useAppStore((s) => s.escrowConfig);
	const network = useAppStore((s) => s.network);
	const account = useAppStore((s) => s.account);
	const days = (n?: number) => (n === undefined ? "—" : `${n} ${n === 1 ? "day" : "days"}`);

	return (
		<>
			<PageHeader
				eyebrow={LIVE ? "Wallet & escrow" : "Prototype controls"}
				title={LIVE ? "Settings" : "Demo settings"}
				description={
					LIVE
						? "Your connected wallet, and the escrow rules the Boluck API enforces on Stellar Testnet."
						: "Switch demo wallets, test failure states and reset the mock data."
				}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<Panel className="p-6">
					<h2 className="font-display text-base font-bold text-ink">Wallet</h2>
					<DetailRows
						className="mt-4"
						rows={[
							...(LIVE
								? [
										{
											label: "Account status",
											value: !account
												? "—"
												: !account.exists
													? "Not active (needs test XLM)"
													: account.usdcTrusted
														? "Active · USDC enabled"
														: "Active · USDC not enabled",
										},
									]
								: [{ label: "Account", value: wallet ? ACCOUNT_NAMES[wallet.address] : "—" }]),
							{ label: "Address", value: <span className="font-mono text-xs">{shortAddress(wallet?.address, 6, 6)}</span> },
							{ label: "Wallet", value: walletName(wallet?.provider) },
							{ label: "USDC balance", value: formatAmount(balance?.usdc ?? 0) },
							{ label: "XLM balance", value: formatAmount(balance?.xlm ?? 0, "XLM") },
						]}
					/>
				</Panel>

				<Panel className="p-6">
					<h2 className="font-display text-base font-bold text-ink">Network</h2>
					<DetailRows
						className="mt-4"
						rows={[
							{
								label: "Network",
								value: network ? `Stellar ${network.network === "testnet" ? "Testnet" : "Mainnet"}` : NETWORK_LABEL,
							},
							{
								label: "Reward asset",
								value: config ? `USDC · ${shortAddress(config.asset.split(":")[1], 4, 4)}` : "Testnet USDC",
							},
							{ label: "Escrow", value: LIVE ? "Claimable balances on Stellar" : "Simulated in this browser" },
							...(LIVE && config
								? [
										{
											label: "Escrow arbiter",
											value: <span className="font-mono text-xs">{shortAddress(config.arbiter, 6, 6)}</span>,
										},
										{ label: "Review window", value: days(config.reviewWindowDays) },
										{
											label: "Revision window",
											value: `${days(config.revisionWindowDays)} · up to ${config.maxRevisions} revisions`,
										},
										{ label: "Automatic release", value: config.autoReleaseEnabled ? "On" : "Off" },
										{ label: "Payments", value: config.configured ? "Available" : "Temporarily unavailable" },
									]
								: []),
							{ label: "Data source", value: LIVE ? API_URL.replace(/^https?:\/\//, "") : "Mock data · this browser" },
						]}
					/>
				</Panel>

				{!LIVE && (
					<Panel className="p-6 lg:col-span-2">
						<h2 className="font-display text-base font-bold text-ink">Simulation</h2>
						<div className="mt-6 space-y-6 divide-y divide-line">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="flex items-center gap-2 text-sm font-semibold text-ink">
										<Users className="size-4 text-primary" /> Demo wallets
									</p>
									<p className="mt-1 text-xs text-muted">
										Issuer: {DEMO_ACCOUNTS.issuer.name} · {shortAddress(DEMO_ACCOUNTS.issuer.address)} — Contributor:{" "}
										{DEMO_ACCOUNTS.contributor.name} · {shortAddress(DEMO_ACCOUNTS.contributor.address)}
									</p>
								</div>
								<RoleToggle />
							</div>
							<label className="flex cursor-pointer items-start justify-between gap-4 pt-6">
								<span>
									<span className="flex items-center gap-2 text-sm font-semibold text-ink">
										<FlaskConical className="size-4 text-primary" /> Simulate failed transactions
									</span>
									<span className="mt-1 block text-xs text-muted">
										Every simulated transaction fails at the token-transfer step, so you can check error states. Bounty status and
										balances never change on failure.
									</span>
								</span>
								<button
									type="button"
									role="switch"
									aria-checked={simulateFailures}
									onClick={() => setSimulateFailures(!simulateFailures)}
									className={cn(
										"relative h-6 w-11 shrink-0 rounded-full transition-colors",
										simulateFailures ? "bg-primary" : "bg-line",
									)}
								>
									<span
										className={cn(
											"absolute top-0.5 left-0.5 size-5 rounded-full bg-ink shadow transition-transform duration-200",
											simulateFailures && "translate-x-5",
										)}
									/>
								</button>
							</label>
							<div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
								<span>
									<span className="text-sm font-semibold text-ink">Reset demo data</span>
									<span className="mt-1 block text-xs text-muted">Restore the seeded bounties, balances and transactions.</span>
								</span>
								<Button
									variant="danger"
									icon={<RotateCcw />}
									onClick={() => window.confirm("Reset all demo bounties, balances and history?") && resetDemo()}
								>
									Reset demo
								</Button>
							</div>
						</div>
					</Panel>
				)}
			</div>
		</>
	);
}
