"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { STATUS_META } from "@repo/stellar/status";
import { Panel } from "@repo/ui/panel";
import { admin, type AdminBounty, type BountyFlag, type BountyStatusFilter } from "@/lib/api/admin";
import { FLAGS } from "@/features/overview/Overview";
import {
	Addr,
	Amount,
	Cell,
	Empty,
	ErrorNote,
	Loading,
	PageHeader,
	Pager,
	Row,
	Rows,
	SearchBox,
	Select,
	StatusBadge,
	useApi,
	useQueryState,
	when,
} from "@/components/ui";

const LIMIT = 20;
const COLS = "minmax(0,2.2fr) 7.5rem 7rem minmax(0,1fr) minmax(0,1fr) 9rem";

/** Attention flags present on a bounty row. */
export function bountyFlags(b: AdminBounty): string[] {
	const out: string[] = [];
	if (b.autoReleaseError) out.push("Auto-release failed");
	if (b.cancelRequestedBy) out.push("Cancellation pending");
	if (b.pastRecovery) out.push("Past recovery");
	return out;
}

export function BountyRows({ items }: { items: AdminBounty[] }) {
	return (
		<Rows head={["Bounty", "Status", "Reward", "Issuer", "Contributor", "Updated"]} cols={COLS}>
			{items.map((b) => {
				const flags = bountyFlags(b);
				return (
					<Row key={b.reference} cols={COLS} href={`/bounties/${b.reference}`}>
						<div className="min-w-0">
							<Link href={`/bounties/${b.reference}`} className="block truncate font-medium text-ink hover:text-primary">
								{b.title || "Untitled draft"}
							</Link>
							<span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-muted">
								{b.reference}
								{!b.onChain && <span>· off-chain draft</span>}
								{flags.map((f) => (
									<span key={f} className="inline-flex items-center gap-1 text-attention">
										<AlertTriangle className="size-3" /> {f}
									</span>
								))}
							</span>
						</div>
						<Cell label="Status">
							<StatusBadge status={b.status} />
						</Cell>
						<Cell label="Reward">
							<Amount value={b.reward} asset={b.asset} />
						</Cell>
						<Cell label="Issuer">
							<Addr address={b.issuerAddress} />
						</Cell>
						<Cell label="Contributor">
							<Addr address={b.contributorAddress} />
						</Cell>
						<Cell label="Updated">
							<span className="text-xs text-muted">{when(b.updatedAt)}</span>
						</Cell>
					</Row>
				);
			})}
		</Rows>
	);
}

export function BountyList() {
	const q = useQueryState();
	const offset = Number(q.get("offset")) || 0;
	const status = q.get("status") as BountyStatusFilter | "";
	const flag = q.get("flag") as BountyFlag | "";
	const search = q.get("search");
	const { data, error, loading, reload } = useApi(
		() =>
			admin.bounties({ limit: LIMIT, offset, status: status || undefined, flag: flag || undefined, search: search || undefined }),
		q.key,
	);

	return (
		<>
			<PageHeader
				title="Bounties"
				description="Every bounty on the platform. Search by title, BL- reference or wallet address."
			/>
			<div className="mb-4 flex flex-wrap gap-2">
				<SearchBox value={search} onChange={(v) => q.set({ search: v })} placeholder="Title, BL-1001 or G… address" />
				<Select
					label="Any status"
					value={status}
					onChange={(v) => q.set({ status: v })}
					options={Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))}
				/>
				<Select
					label="Any flag"
					value={flag}
					onChange={(v) => q.set({ flag: v })}
					options={Object.entries(FLAGS).map(([value, f]) => ({ value, label: f.label }))}
				/>
			</div>
			{flag && <p className="mb-3 text-xs text-muted">{FLAGS[flag as BountyFlag]?.hint}</p>}
			{error && <ErrorNote message={error} onRetry={reload} />}
			<Panel className="min-w-0 py-2">
				{loading && !data ? (
					<div className="p-4">
						<Loading />
					</div>
				) : data && data.result.length === 0 ? (
					<Empty title="No bounties match" />
				) : data ? (
					<>
						<BountyRows items={data.result} />
						<div className="pb-2">
							<Pager page={data} offset={offset} limit={LIMIT} onOffset={(o) => q.set({ offset: o })} />
						</div>
					</>
				) : null}
			</Panel>
		</>
	);
}
