"use client";

import { ArrowRight, CircleDollarSign, FileCheck2, Fingerprint, FolderOpen, Lock } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ActivityFeed } from "@/features/bounties/components/ActivityFeed";
import { BountyTable } from "@/features/bounties/components/BountyTable";
import { EscrowOrb } from "@/features/bounties/components/EscrowOrb";
import { StatCard } from "@/features/bounties/components/StatCard";
import { StatusBadge } from "@/features/bounties/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLink } from "@repo/ui/button";
import { CountUp } from "@repo/ui/animated-number";
import { EmptyState } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { Reveal } from "@repo/ui/reveal";
import { ACTIVE_STATUSES } from "@repo/stellar/status";
import { formatUsd, pad2 } from "@repo/stellar/format";
import type { Bounty, Role } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { useMyTransactions, useRoleBounties } from "@/features/escrow/hooks";
import { LIVE } from "@/lib/api/config";
import { toTransactions } from "@/lib/api/mappers";

export function OverviewView() {
	const role = useAppStore((s) => s.role);
	return (
		<>
			<PageHeader
				eyebrow="One workspace · Two sides of every bounty"
				title="Your Boluck workspace."
				description="Post funded bounties, deliver assigned work, and follow every reward through to payment."
				actions={<RoleToggle />}
			/>
			<div key={role} className="animate-fade-up">
				{role === "issuer" ? <IssuerOverview /> : <ContributorOverview />}
			</div>
		</>
	);
}

/** Issuer / Contributor views. Live: a filter over one wallet's bounties. Demo: also switches the demo wallet. */
export function RoleToggle() {
	const role = useAppStore((s) => s.role);
	const setRole = useAppStore((s) => s.setRole);
	return (
		<div className="flex gap-4" role="tablist" aria-label="View as">
			{(["issuer", "contributor"] as Role[]).map((r) => (
				<button
					key={r}
					role="tab"
					aria-selected={role === r}
					onClick={() => setRole(r)}
					className={cn(
						"h-8 rounded-[var(--radius-sm)] border px-3 text-[13px] font-medium capitalize transition-all duration-200 active:scale-[0.97]",
						role === r ? "border-primary bg-primary text-on-primary" : "border-line bg-canvas text-ink hover:border-subtle",
					)}
				>
					{r}
				</button>
			))}
		</div>
	);
}

function useStats(bounties: Bounty[]) {
	return useMemo(() => {
		const active = bounties.filter((b) => ACTIVE_STATUSES.includes(b.status));
		return {
			active,
			escrow: active.reduce((sum, b) => sum + b.escrowBalance, 0),
			review: bounties.filter((b) => b.status === "submitted"),
			paid: bounties.filter((b) => b.status === "paid").reduce((s, b) => s + b.rewardAmount, 0),
		};
	}, [bounties]);
}

function SectionHead({ title, description, href, cta }: { title: string; description: string; href?: string; cta?: string }) {
	return (
		<div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
			<div>
				<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink sm:text-lg">{title}</h2>
				<p className="mt-1.5 text-sm text-muted">{description}</p>
			</div>
			{href && (
				<Link href={href} className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
					{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
				</Link>
			)}
		</div>
	);
}

function IssuerOverview() {
	const bounties = useRoleBounties();
	const allBounties = useAppStore((s) => s.bounties);
	const address = useAppStore((s) => s.wallet?.address);
	const myTxs = useMyTransactions();
	const local = useStats(bounties);
	// Live: the PRD dashboard totals come from `GET /dashboard` (the server's view of this wallet).
	const dashboard = useAppStore((s) => s.dashboard);
	const recent = useMemo(() => (dashboard ? toTransactions(dashboard.recentActivity) : null), [dashboard]);
	const txs = (LIVE && recent) || myTxs;
	const stats = {
		review: local.review,
		active: LIVE && dashboard ? dashboard.activeBounties : local.active.length,
		escrow: LIVE && dashboard ? Number(dashboard.fundedRewards) : local.escrow,
		pending: LIVE && dashboard ? dashboard.pendingSubmissions : local.review.length,
		completed: LIVE && dashboard ? dashboard.completedPayouts : null,
		paid: local.paid,
	};
	const listed = bounties.filter((b) => b.status !== "refunded" && b.status !== "cancelled").slice(0, 5);

	return (
		<div className="space-y-8 lg:space-y-10">
			<Panel className="flex flex-col gap-8 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
				<div className="max-w-xl">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/70 px-2 py-1 text-[10px] font-medium text-primary uppercase">
						<span className="size-1.5 rounded-full bg-primary" /> Locked in escrow on Stellar
					</span>
					<h2 className="mt-4 font-display text-xl font-bold tracking-[-0.02em] text-ink">
						The work is agreed. The reward is already there.
					</h2>
					<p className="mt-4 text-[15px] leading-7 text-muted sm:text-base">
						Funds stay in escrow until you approve the work. No chasing, and no uncertainty for your contributors.
					</p>
					<div className="mt-6 flex flex-wrap gap-4">
						<ButtonLink href="/bounties/new" size="sm" iconRight={<ArrowRight />}>
							Post a bounty
						</ButtonLink>
						<ButtonLink href="/bounties?filter=issued" size="sm" variant="secondary">
							Your bounties
						</ButtonLink>
					</div>
				</div>
				<div className="relative hidden justify-center sm:flex md:pr-6">
					<span className="absolute inset-0 m-auto size-40 animate-glow rounded-full bg-primary/15 blur-2xl" aria-hidden />
					<EscrowOrb />
				</div>
			</Panel>

			<div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
				<StatCard
					label="Active bounties"
					icon={<FolderOpen />}
					value={<CountUp value={stats.active} format={pad2} />}
					hint={
						LIVE
							? `${dashboard?.drafts ?? 0} ${dashboard?.drafts === 1 ? "draft" : "drafts"} not yet funded`
							: "Across all projects"
					}
				/>
				<StatCard
					label={LIVE ? "Funded rewards" : "Locked in escrow"}
					icon={<Lock />}
					value={<CountUp value={stats.escrow} format={formatUsd} />}
					hint="USDC locked in escrow on Stellar"
				/>
				<StatCard
					label={LIVE ? "Pending submissions" : "Ready for review"}
					icon={<FileCheck2 />}
					value={<CountUp value={stats.pending} format={pad2} />}
					hintAccent={
						stats.review[0] ? (
							<Link href={`/bounties/${stats.review[0].id}/review`} className="font-semibold text-primary hover:underline">
								Review
							</Link>
						) : (
							<span />
						)
					}
					hint={stats.pending ? "Awaiting review" : "Nothing to review"}
				/>
				{stats.completed !== null ? (
					<StatCard
						label="Completed payouts"
						icon={<CircleDollarSign />}
						value={<CountUp value={stats.completed} format={pad2} />}
						hint="Rewards released to contributors"
					/>
				) : (
					<StatCard
						label="Successfully paid"
						icon={<CircleDollarSign />}
						value={<CountUp value={stats.paid} format={formatUsd} />}
						hint="Released to contributors"
					/>
				)}
			</div>

			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_392px] xl:gap-10 [&>*]:min-w-0">
				<Reveal as="section">
					<SectionHead
						title="Active bounties"
						description="Work you've funded or need to review."
						href="/bounties"
						cta="View all"
					/>
					<Panel>
						{listed.length ? (
							<BountyTable bounties={listed} />
						) : (
							<EmptyState
								icon={<FolderOpen />}
								title="No bounties yet"
								description="Post your first funded bounty — the reward is locked before anyone starts."
								action={
									<ButtonLink href="/bounties/new" size="sm">
										Post a bounty
									</ButtonLink>
								}
							/>
						)}
					</Panel>
				</Reveal>
				<Reveal as="section">
					<SectionHead title="Recent activity" description="The latest confirmed steps on your bounties." />
					<Panel className="p-6">
						<ActivityFeed transactions={txs} bounties={allBounties} me={address} limit={4} />
					</Panel>
				</Reveal>
			</div>

			<Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-deep text-primary">
						<Fingerprint className="size-5" />
					</span>
					<div>
						<p className="text-xs font-semibold text-ink">Locked in escrow on Stellar</p>
						<p className="mt-0.5 text-[10px] text-muted">
							{LIVE ? "Stellar Testnet · every step has a transaction hash" : "Demo mode · simulated in this browser"}
						</p>
					</div>
				</div>
				<Link href="/refunds" className="group inline-flex items-center gap-3 text-[10px] text-ink">
					View refund policy <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
				</Link>
			</Panel>
		</div>
	);
}

function ContributorOverview() {
	const assignments = useRoleBounties();
	const pending = assignments.filter((b) => ACTIVE_STATUSES.includes(b.status)).reduce((s, b) => s + b.escrowBalance, 0);
	const dashboard = useAppStore((s) => s.dashboard);
	const paid =
		LIVE && dashboard
			? Number(dashboard.earned)
			: assignments.filter((b) => b.status === "paid").reduce((s, b) => s + b.rewardAmount, 0);
	const next = assignments
		.map((b) => {
			if (b.status === "assigned") return { b, label: "Accept your assignment", href: `/bounties/${b.id}` };
			if (b.status === "in_progress") return { b, label: "Continue your work", href: `/bounties/${b.id}/submit` };
			if (b.status === "revision_requested") return { b, label: "Submit a revision", href: `/bounties/${b.id}/submit` };
			return null;
		})
		.filter((x): x is NonNullable<typeof x> => !!x);

	return (
		<div className="space-y-8 lg:space-y-10">
			<Panel className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
				<div className="max-w-xl">
					<span className="inline-flex items-center gap-1.5 rounded-full border border-primary/70 px-2 py-1 text-[10px] font-medium text-primary uppercase">
						<span className="size-1.5 rounded-full bg-primary" /> Funded before you start
					</span>
					<h2 className="mt-4 font-display text-xl font-bold tracking-[-0.02em] text-ink">
						Work with the reward already secured.
					</h2>
					<p className="mt-4 text-[15px] leading-7 text-muted sm:text-base">
						Check the brief, deadline, acceptance criteria, and verified escrow before you accept an assignment.
					</p>
					<ButtonLink href="/bounties?filter=assigned" size="sm" iconRight={<ArrowRight />} className="mt-6 min-h-9">
						Your assignments
					</ButtonLink>
				</div>
				<div className="stagger grid grid-cols-2 gap-4 lg:w-[344px]">
					<MiniStat
						label="Pending rewards"
						value={<CountUp value={pending} format={formatUsd} />}
						hint="USDC in active work"
						icon={<Lock />}
					/>
					<MiniStat
						label="Paid to you"
						value={<CountUp value={paid} format={formatUsd} />}
						hint={LIVE ? "USDC received" : "USDC demo total"}
						icon={<CircleDollarSign />}
					/>
				</div>
			</Panel>

			<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_392px] xl:gap-10 [&>*]:min-w-0">
				<Reveal as="section">
					<SectionHead
						title="Your assignments"
						description="Accept, deliver, and track every review."
						href="/history"
						cta="Payment history"
					/>
					<Panel>
						{assignments.length ? (
							<BountyTable
								bounties={assignments.filter((b) => b.status !== "refunded" && b.status !== "cancelled")}
								header={false}
							/>
						) : (
							<EmptyState
								icon={<FolderOpen />}
								title="No assignments yet"
								description="Share your wallet address with an issuer. Bounties they assign to you appear here."
							/>
						)}
					</Panel>
				</Reveal>
				<Reveal as="section">
					<SectionHead title="Next actions" description="Keep your work moving forward." />
					<Panel className="divide-y divide-line">
						{next.length === 0 ? (
							<p className="p-6 text-xs text-muted">You&apos;re all caught up.</p>
						) : (
							next.map(({ b, label, href }) => (
								<Link key={b.id} href={href} className="group flex items-center gap-4 p-6 transition-colors hover:bg-elevated/50">
									<span className="size-2 shrink-0 rounded-full bg-review" aria-hidden />
									<span className="min-w-0 flex-1">
										<span className="block text-sm font-semibold text-ink transition-colors group-hover:text-primary">
											{label}
										</span>
										<span className="mt-1 block truncate text-[10px] text-muted">
											{b.title} · {formatUsd(b.rewardAmount)} USDC
										</span>
									</span>
									<StatusBadge status={b.status} />
								</Link>
							))
						)}
					</Panel>
				</Reveal>
			</div>

			{!LIVE && (
				<p className="text-center text-[10px] text-muted">
					All wallet balances and escrow states shown are simulated for this testnet prototype. No real USDC moves.
				</p>
			)}
		</div>
	);
}

function MiniStat({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint: string; icon: React.ReactNode }) {
	return (
		<div className="rounded-[var(--radius-md)] border border-line p-5 sm:p-6">
			<div className="flex items-start justify-between gap-2">
				<p className="text-xs text-ink">{label}</p>
				<span className="grid size-6 shrink-0 place-items-center rounded-[4px] bg-elevated text-primary [&_svg]:size-3.5">
					{icon}
				</span>
			</div>
			<p className="mt-5 font-display text-2xl font-bold text-ink sm:text-3xl">{value}</p>
			<p className="mt-3 text-[10px] text-muted">{hint}</p>
		</div>
	);
}
