"use client";

import { ArrowRight, SearchX, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { use, useEffect } from "react";
import { ButtonLink } from "@repo/ui/button";
import { EmptyState, Skeleton } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { formatDate, formatUsd } from "@repo/stellar/format";
import type { Bounty } from "@repo/stellar/bounty";
import { useAppStore, useBounty } from "@/features/escrow/store";
import { LIVE } from "@/lib/api/config";
import { BountyIcon } from "./BountyIcon";
import { StatusBadge } from "./StatusBadge";

export type BountyParams = Promise<{ id: string }>;

/** Resolves the `[id]` route param and looks the bounty up in the store (live: also loads it from the API). */
export function useBountyRoute(params: BountyParams) {
	const { id: raw } = use(params);
	const id = decodeURIComponent(raw).toUpperCase();
	const bounty = useBounty(id);
	const address = useAppStore((s) => s.wallet?.address);
	const loadBounty = useAppStore((s) => s.loadBounty);
	useEffect(() => {
		if (LIVE && address) void loadBounty(id);
	}, [id, address, loadBounty]);
	return {
		id,
		bounty,
		address,
		isIssuer: !!bounty && bounty.issuer === address,
		isContributor: !!bounty && !!bounty.contributor && bounty.contributor === address,
	};
}

export function BountyNotFound({ id }: { id: string }) {
	// Live: the bounty may still be on its way from the API.
	const loading = useAppStore((s) => !s.loaded || !!s.fetching[id]);
	if (loading)
		return (
			<div className="space-y-6" aria-busy aria-label="Loading bounty">
				<Skeleton className="h-32" />
				<Skeleton className="h-24" />
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px]">
					<Skeleton className="h-72" />
					<Skeleton className="h-72" />
				</div>
			</div>
		);
	return (
		<Panel className="mx-auto max-w-xl">
			<EmptyState
				icon={<SearchX />}
				title={`We couldn't find ${id}`}
				description={
					LIVE
						? "Only a bounty's issuer and contributor can open it. Check you're connected with the right wallet, or that the link isn't mistyped."
						: "It may have been created in another browser — demo data lives in this browser only — or the link is mistyped."
				}
				action={
					<ButtonLink href={LIVE ? "/overview" : "/bounties"} size="sm" iconRight={<ArrowRight />}>
						{LIVE ? "Back to Overview" : "Explore bounties"}
					</ButtonLink>
				}
			/>
		</Panel>
	);
}

/** Title card at the top of the bounty details screen. */
export function BountyHeaderCard({ bounty, caption }: { bounty: Bounty; caption: string }) {
	return (
		<Panel className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
			<div className="flex min-w-0 items-start gap-4">
				<BountyIcon icon={bounty.icon} size="md" tone="deep" />
				<div className="min-w-0">
					<p className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
						{bounty.id}
						{bounty.project && ` · ${bounty.project.toLowerCase()}`} <StatusBadge status={bounty.status} />
					</p>
					<h1 className="mt-1.5 font-display text-xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-2xl">
						{bounty.title}
					</h1>
					<p className="mt-1.5 text-[10px] text-muted">Deadline {formatDate(bounty.deadline)} · Stellar Testnet</p>
				</div>
			</div>
			<div className="shrink-0 sm:text-right">
				<p className="font-display text-2xl font-bold text-ink">
					{formatUsd(bounty.rewardAmount)} <span className="text-base text-muted">USDC</span>
				</p>
				<p className="mt-1 text-[10px] text-primary">{caption}</p>
			</div>
		</Panel>
	);
}

/** Small header used in the submit / review forms. */
export function BountyMiniHeader({ bounty }: { bounty: Bounty }) {
	return (
		<div className="flex items-start gap-3">
			<span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-deep text-primary">
				<ShieldCheck className="size-4" />
			</span>
			<div className="min-w-0">
				<Link
					href={`/bounties/${bounty.id}`}
					className="font-display text-base font-bold tracking-[-0.02em] text-ink hover:text-primary sm:text-lg"
				>
					{bounty.title}
				</Link>
				<p className="mt-1 text-[10px] text-muted">
					{bounty.id}
					{bounty.project && ` · ${bounty.project.toLowerCase()}`} · {formatUsd(bounty.rewardAmount)} USDC
				</p>
			</div>
		</div>
	);
}
