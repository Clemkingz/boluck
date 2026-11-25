"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { shortHash } from "@repo/stellar/format";
import { Button } from "@repo/ui/button";
import { Panel } from "@repo/ui/panel";
import { toast } from "@repo/ui/toast";
import { ApiError } from "@/lib/api/client";
import { admin, type ActionKindFilter, type AdminTransaction, type TxStatusFilter } from "@/lib/api/admin";
import {
	Addr,
	Amount,
	Cell,
	describe,
	Empty,
	ErrorNote,
	Explorer,
	humanize,
	Loading,
	PageHeader,
	Pager,
	Row,
	Rows,
	SearchBox,
	Select,
	Toggle,
	TxStatusBadge,
	useApi,
	useQueryState,
	when,
} from "@/components/ui";

const LIMIT = 20;
const COLS = "minmax(0,1.4fr) minmax(0,1.6fr) 7rem minmax(0,1fr) 7rem 9rem";
const KINDS: ActionKindFilter[] = [
	"create",
	"fund",
	"assign",
	"accept",
	"submit",
	"request_revision",
	"approve",
	"release",
	"cancel",
	"request_cancel",
	"withdraw_cancel",
	"confirm_cancel",
	"reclaim",
	"auto_release",
];
const STATUSES: TxStatusFilter[] = ["prepared", "pending", "confirmed", "failed", "expired"];

/** Open = not settled yet; only these can be re-checked on Stellar. */
const isOpen = (t: AdminTransaction) => t.stuck || t.status === "pending" || t.status === "prepared";

function Reconcile({ tx, onDone }: { tx: AdminTransaction; onDone: () => void }) {
	const [busy, setBusy] = useState(false);
	return (
		<Button
			size="sm"
			variant="secondary"
			icon={<RefreshCw />}
			loading={busy}
			loadingText="Checking…"
			onClick={async () => {
				setBusy(true);
				try {
					await admin.reconcile(tx.id);
					toast.success("Re-checked on Stellar", { description: `${humanize(tx.kind)} · ${tx.reference}` });
					onDone();
				} catch (e) {
					toast.error("Couldn't re-check it", { description: e instanceof ApiError ? e.message : "Try again." });
				} finally {
					setBusy(false);
				}
			}}
		>
			Re-check on Stellar
		</Button>
	);
}

export function TxRows({
	items,
	onChange,
	showBounty = true,
}: {
	items: AdminTransaction[];
	onChange: () => void;
	showBounty?: boolean;
}) {
	return (
		<Rows head={["Action", showBounty ? "Bounty" : "Signer", "Status", "Amount", "Hash", "Created"]} cols={COLS}>
			{items.map((t) => {
				const problem = t.failureCode || describe(t.failure) || describe(t.rejection);
				return (
					<Row key={t.id} cols={COLS}>
						<div className="min-w-0">
							<span className="block font-medium text-ink">{humanize(t.kind)}</span>
							{showBounty && (
								<span className="mt-0.5 block text-[10px] text-muted">
									by <Addr address={t.signer} />
								</span>
							)}
						</div>
						<Cell label={showBounty ? "Bounty" : "Signer"}>
							{showBounty ? (
								<Link href={`/bounties/${t.reference}`} className="block truncate text-ink hover:text-primary">
									<span className="text-xs text-muted">{t.reference}</span> {t.bountyTitle}
								</Link>
							) : (
								<Addr address={t.signer} />
							)}
						</Cell>
						<Cell label="Status">
							<TxStatusBadge status={t.status} stuck={t.stuck} />
						</Cell>
						<Cell label="Amount">
							<Amount value={t.amount} />
						</Cell>
						<Cell label="Hash">
							{t.explorerUrl ? (
								<Explorer href={t.explorerUrl} label={shortHash(t.hash)} />
							) : (
								<span className="font-mono text-xs text-muted">{shortHash(t.hash)}</span>
							)}
						</Cell>
						<Cell label="Created">
							<span className="text-xs text-muted">{when(t.createdAt)}</span>
						</Cell>
						{(problem || isOpen(t)) && (
							<div className="flex flex-wrap items-center gap-3 lg:col-span-full">
								{/* basis-40: on narrow screens the button drops below instead of squeezing the message. */}
								{problem && <p className="min-w-0 flex-1 basis-40 text-xs break-words text-attention">{problem}</p>}
								{isOpen(t) && <Reconcile tx={t} onDone={onChange} />}
							</div>
						)}
					</Row>
				);
			})}
		</Rows>
	);
}

export function TxList() {
	const q = useQueryState();
	const offset = Number(q.get("offset")) || 0;
	const status = q.get("status") as TxStatusFilter | "";
	const kind = q.get("kind") as ActionKindFilter | "";
	const stuck = q.get("stuck") === "1";
	const rejected = q.get("rejected") === "1";
	const search = q.get("search");
	const { data, error, loading, reload } = useApi(
		() =>
			admin.transactions({
				limit: LIMIT,
				offset,
				status: status || undefined,
				kind: kind || undefined,
				stuck: stuck || undefined,
				rejected: rejected || undefined,
				search: search || undefined,
			}),
		q.key,
	);

	return (
		<>
			<PageHeader
				title="Transactions"
				description="Every on-chain action. Re-checking reads the result from Stellar; it can't sign, submit or move funds."
			/>
			<div className="mb-4 flex flex-wrap gap-2">
				<SearchBox value={search} onChange={(v) => q.set({ search: v })} placeholder="BL- reference, hash or signer" />
				<Select
					label="Any status"
					value={status}
					onChange={(v) => q.set({ status: v })}
					options={STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
				/>
				<Select
					label="Any action"
					value={kind}
					onChange={(v) => q.set({ kind: v })}
					options={KINDS.map((k) => ({ value: k, label: humanize(k) }))}
				/>
				<Toggle label="Stuck" checked={stuck} onChange={(v) => q.set({ stuck: v ? 1 : null })} />
				<Toggle label="Not applied" checked={rejected} onChange={(v) => q.set({ rejected: v ? 1 : null })} />
			</div>
			{error && <ErrorNote message={error} onRetry={reload} />}
			<Panel className="min-w-0 py-2">
				{loading && !data ? (
					<div className="p-4">
						<Loading />
					</div>
				) : data && data.result.length === 0 ? (
					<Empty title="No transactions match" />
				) : data ? (
					<>
						<TxRows items={data.result} onChange={reload} />
						<div className="pb-2">
							<Pager page={data} offset={offset} limit={LIMIT} onOffset={(o) => q.set({ offset: o })} />
						</div>
					</>
				) : null}
			</Panel>
		</>
	);
}
