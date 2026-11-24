"use client";

import { AlertTriangle, CircleCheck, Lock, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BountyNotFound, useBountyRoute, type BountyParams } from "@/features/bounties/components/BountyRoute";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/field";
import { Notice } from "@repo/ui/misc";
import { DetailRows, IconTile, Panel } from "@repo/ui/panel";
import { walletName } from "@/features/wallet/wallets";
import { canFund } from "@repo/stellar/escrow";
import { formatUsd, shortAddress } from "@repo/stellar/format";
import { useAppStore, useWalletBalance } from "@/features/escrow/store";

export function FundBounty({ params }: { params: BountyParams }) {
	const router = useRouter();
	const { id, bounty, address, isIssuer } = useBountyRoute(params);
	const wallet = useAppStore((s) => s.wallet);
	const balance = useWalletBalance();
	const fund = useAppStore((s) => s.fundBounty);
	const [authorized, setAuthorized] = useState(false);
	const [busy, setBusy] = useState(false);
	if (!bounty) return <BountyNotFound id={id} />;

	const back = { href: `/bounties/${bounty.id}`, label: "Back to bounty" };
	const usdc = balance?.usdc ?? 0;
	const guard = canFund(bounty, address, balance);
	const alreadyFunded = bounty.status !== "draft";

	return (
		<>
			<PageHeader
				back={back}
				eyebrow="Funding · Stellar Testnet"
				title="Secure the reward first."
				description="Review the amount and funding wallet before simulating escrow funding. This preview does not move testnet USDC."
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
				<Panel className="p-5 sm:p-6">
					<div className="flex items-start gap-4 border-b border-line pb-6">
						<IconTile>
							<Lock />
						</IconTile>
						<div>
							<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">Bounty escrow summary</h2>
							<p className="mt-1 text-[10px] text-muted">
								{bounty.id} · {bounty.project.toLowerCase()} · {bounty.title}
							</p>
						</div>
					</div>
					<DetailRows
						className="py-4"
						rows={[
							{ label: "Available USDC balance", value: `${formatUsd(usdc)} USDC` },
							{ label: "Reward", value: `${formatUsd(bounty.rewardAmount)} USDC` },
							{
								label: "Balance after funding",
								value: (
									<span className={usdc < bounty.rewardAmount ? "text-attention" : undefined}>
										{usdc < bounty.rewardAmount ? "Insufficient" : `${formatUsd(usdc - bounty.rewardAmount)} USDC`}
									</span>
								),
							},
							{ label: "Funding wallet", value: shortAddress(address) },
							{ label: "Contributor", value: bounty.contributor ? shortAddress(bounty.contributor) : "Open to claim" },
							{ label: "Reward token", value: "Testnet USDC · Stellar" },
						]}
					/>

					{alreadyFunded ? (
						<Notice tone="primary" icon={<CircleCheck />} title="This bounty is already funded" className="mt-2">
							The reward is locked in escrow.{" "}
							<ButtonLink href={back.href} variant="ghost" size="sm" className="h-auto px-0 text-primary hover:bg-transparent">
								View the bounty →
							</ButtonLink>
						</Notice>
					) : (
						<>
							{guard && !isIssuer ? null : guard ? (
								<Notice tone="attention" icon={<AlertTriangle />} className="mt-2">
									{guard}
								</Notice>
							) : null}
							{!isIssuer && (
								<Notice tone="attention" icon={<AlertTriangle />} className="mt-2">
									Only the issuer ({shortAddress(bounty.issuer)}) can fund this bounty.
								</Notice>
							)}
							<label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-line bg-canvas/60 p-4 transition-colors hover:border-subtle has-[:checked]:border-primary/60">
								<Checkbox
									checked={authorized}
									onChange={(e) => setAuthorized(e.target.checked)}
									disabled={!!guard}
									className="mt-0.5"
								/>
								<span>
									<span className="block text-sm font-medium text-ink">I authorize this funding step</span>
									<span className="mt-1 block text-[10px] leading-relaxed text-muted">
										The prototype will ask your wallet to confirm, then update the bounty status. No real funds are transferred.
									</span>
								</span>
							</label>
							<Button
								className="mt-6"
								fullWidth
								size="lg"
								icon={<Lock />}
								disabled={!authorized || !!guard}
								loading={busy}
								loadingText="Waiting for your wallet…"
								onClick={async () => {
									setBusy(true);
									const ok = await fund(bounty.id);
									setBusy(false);
									if (ok) router.push(`/bounties/${bounty.id}?confirmed=fund`);
								}}
							>
								Confirm funding · {formatUsd(bounty.rewardAmount)} USDC
							</Button>
						</>
					)}
				</Panel>

				<Panel className="h-fit p-6">
					<div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line p-4">
						<IconTile size="sm">
							<Wallet />
						</IconTile>
						<div className="min-w-0 flex-1">
							<p className="text-[10px] text-ink">Connected wallet · {walletName(wallet?.provider)}</p>
							<p className="mt-0.5 font-mono text-xs font-medium text-ink">{shortAddress(address)}</p>
						</div>
						<span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">Testnet</span>
					</div>
					<h3 className="mt-6 font-display text-base font-bold text-ink">Before work begins</h3>
					<ul className="mt-4 space-y-3 text-[10px] text-muted">
						{[
							"Reward amount matches the agreed brief",
							"Acceptance criteria are visible to contributors",
							"Work starts after funding is confirmed",
						].map((t) => (
							<li key={t} className="flex items-center gap-2.5">
								<CircleCheck className="size-4 shrink-0 text-primary" /> {t}
							</li>
						))}
					</ul>
					<Notice tone="review" title="Preview-only confirmation" className="mt-6">
						On the live app, the escrow contract would verify the transfer and return a Stellar transaction hash. No contract
						transaction is connected here.
					</Notice>
				</Panel>
			</div>
		</>
	);
}
