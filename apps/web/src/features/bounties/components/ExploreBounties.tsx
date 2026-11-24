"use client";

import { Check, ChevronDown, FolderOpen, ListFilter, Plus, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BountyTable } from "@/features/bounties/components/BountyTable";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { EmptyState } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { useClickOutside } from "@/components/layouts/WalletMenu";
import type { Bounty } from "@repo/stellar/bounty";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";

const FILTERS: { id: string; label: string; test: (b: Bounty, me?: string) => boolean }[] = [
	{ id: "all", label: "All bounties", test: (b) => b.status !== "cancelled" && b.status !== "refunded" },
	{ id: "open", label: "Open to claim", test: (b) => b.status === "funded" && !b.contributor },
	{ id: "mine", label: "My bounties", test: (b, me) => b.issuer === me || b.contributor === me },
	{ id: "draft", label: "Unfunded drafts", test: (b) => b.status === "draft" },
	{ id: "active", label: "In progress", test: (b) => ["assigned", "in_progress", "revision_requested"].includes(b.status) },
	{ id: "review", label: "In review", test: (b) => b.status === "submitted" || b.status === "approved" },
	{ id: "paid", label: "Paid", test: (b) => b.status === "paid" },
	{ id: "closed", label: "Cancelled & refunded", test: (b) => b.status === "cancelled" || b.status === "refunded" },
];

export function BountiesView() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const filter = FILTERS.find((f) => f.id === params.get("filter")) ?? FILTERS[0];
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const menuRef = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
	const bounties = useAppStore((s) => s.bounties);
	const me = useAppStore((s) => s.wallet?.address);

	const visible = useMemo(() => {
		const q = query.trim().toLowerCase();
		return bounties
			.filter((b) => filter.test(b, me))
			.filter((b) => !q || [b.title, b.id, b.project].some((v) => v.toLowerCase().includes(q)));
	}, [bounties, filter, me, query]);

	const setFilter = (id: string) => {
		setOpen(false);
		router.replace(id === "all" ? pathname : `${pathname}?filter=${id}`, { scroll: false });
	};

	return (
		<>
			<PageHeader
				eyebrow="The work is real. The reward is ready."
				title="Find your next opportunity."
				description="Each open bounty has a visible reward, a clear brief, and funds set aside before work begins."
				actions={
					<ButtonLink href="/bounties/new" icon={<Plus />}>
						Post a bounty
					</ButtonLink>
				}
			/>

			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
				<label className="relative flex-1">
					<span className="sr-only">Search bounties or projects</span>
					<Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search bounties or projects…"
						className="h-10 w-full rounded-[var(--radius-sm)] border border-line bg-canvas pr-4 pl-11 text-sm text-ink placeholder:text-[11px] placeholder:text-muted focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none"
					/>
				</label>
				<div className="relative" ref={menuRef}>
					<Button
						variant="secondary"
						className="h-10 w-full justify-between sm:w-auto"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						aria-haspopup="listbox"
					>
						<ListFilter className="size-4" />
						<span className="flex-1 text-left">{filter.label}</span>
						<ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
					</Button>
					{open && (
						<ul
							role="listbox"
							className="absolute right-0 z-20 mt-2 w-full min-w-56 animate-pop-in rounded-[var(--radius-md)] border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)]"
						>
							{FILTERS.map((f) => (
								<li key={f.id}>
									<button
										role="option"
										aria-selected={f.id === filter.id}
										onClick={() => setFilter(f.id)}
										className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-ink hover:bg-elevated"
									>
										{f.label}
										{f.id === filter.id && <Check className="size-4 text-primary" />}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<Panel>
				<div className="flex items-center justify-between border-b border-line px-6 py-4 text-[10px]">
					<span className="font-semibold text-ink">
						{visible.length} {visible.length === 1 ? "Bounty" : "Bounties"}
					</span>
					<span className="flex items-center gap-1.5 text-muted">
						<span className="size-1.5 rounded-full bg-primary" /> Funding verified
					</span>
				</div>
				{visible.length === 0 ? (
					<EmptyState
						icon={<FolderOpen />}
						title="No bounties match"
						description="Try a different search or filter."
						action={
							<Button
								size="sm"
								variant="secondary"
								onClick={() => {
									setQuery("");
									setFilter("all");
								}}
							>
								Clear filters
							</Button>
						}
					/>
				) : (
					<BountyTable bounties={visible} header={false} trailingIcon />
				)}
			</Panel>
		</>
	);
}
