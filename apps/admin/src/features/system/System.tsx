"use client";

import { CircleCheck, CircleX, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { DetailRows } from "@repo/ui/panel";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/lib/utils";
import { ApiError } from "@/lib/api/client";
import { admin, type AdminSystem } from "@/lib/api/admin";
import { Addr, Amount, ErrorNote, Explorer, humanize, Loading, PageHeader, Section, useApi, when } from "@/components/ui";

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
const duration = (s: number) => (s % 3600 === 0 ? `${s / 3600} h` : s % 60 === 0 ? `${s / 60} min` : `${s} s`);

function Health({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-[var(--radius-md)] border p-4",
				ok ? "border-line" : "border-attention/60 bg-attention/10",
			)}
		>
			{ok ? <CircleCheck className="size-5 shrink-0 text-primary" /> : <CircleX className="size-5 shrink-0 text-attention" />}
			<span className="min-w-0">
				<span className="block text-sm font-semibold text-ink">{label}</span>
				<span className="block text-[10px] text-muted">{detail ?? (ok ? "Up" : "Down")}</span>
			</span>
		</div>
	);
}

export function SystemView() {
	const { data, error, loading, reload } = useApi(admin.system, "system");
	const [fresh, setFresh] = useState<AdminSystem | null>(null);
	const [running, setRunning] = useState(false);
	const s = fresh ?? data;

	const runWorker = async () => {
		setRunning(true);
		try {
			setFresh(await admin.runWorker());
			toast.success("Worker pass finished", {
				description: "Synced with Stellar, settled open transactions and ran any auto-release already due.",
			});
		} catch (e) {
			toast.error("The worker pass failed", { description: e instanceof ApiError ? e.message : "Try again." });
		} finally {
			setRunning(false);
		}
	};

	return (
		<>
			<PageHeader
				title="System"
				description="Services, the escrow arbiter account, the worker and the chain indexer."
				actions={
					<Button size="sm" icon={<Play />} loading={running} loadingText="Running…" onClick={() => void runWorker()}>
						Run worker now
					</Button>
				}
			/>
			{error && <ErrorNote message={error} onRetry={reload} />}
			{loading && !s && <Loading rows={6} />}
			{s && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
						{Object.entries(s.services).map(([name, state]) => (
							<Health key={name} ok={state === "up"} label={humanize(name)} detail={humanize(state)} />
						))}
						<Health
							ok={s.escrowConfigured}
							label="Escrow"
							detail={s.escrowConfigured ? "Configured · payments on" : "Not configured · payments paused"}
						/>
					</div>
					<div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
						<Section title="Escrow arbiter" action={<Explorer href={s.arbiter.explorerUrl} label="stellar.expert" />}>
							<DetailRows
								rows={[
									{
										label: "Status",
										value: (
											<span className={s.arbiter.status === "ok" ? "text-primary" : "text-attention"}>
												{humanize(s.arbiter.status)}
											</span>
										),
									},
									{ label: "Account", value: <Addr address={s.arbiter.address} link={false} /> },
									{ label: "XLM balance", value: <Amount value={s.arbiter.xlmBalance} asset="XLM" /> },
									{ label: "Reserved XLM", value: <Amount value={String(s.arbiter.reservedXlm)} asset="XLM" /> },
									{ label: "Asset balance", value: <Amount value={s.arbiter.assetBalance} asset={s.asset} /> },
									{ label: "Open claimable balances", value: s.arbiter.openBalances },
								]}
							/>
						</Section>
						<Section title="Escrow rules">
							<DetailRows
								rows={[
									{ label: "Network", value: humanize(s.network) },
									{
										label: "Asset",
										value: (
											<span className="font-mono text-xs">
												{s.asset.split(":")[0]} · {s.asset.split(":")[1]?.slice(0, 4)}…
											</span>
										),
									},
									{ label: "Review window", value: days(s.rules.reviewWindowDays) },
									{ label: "Revision window", value: `${days(s.rules.revisionWindowDays)} · up to ${s.rules.maxRevisions}` },
									{ label: "Grace period", value: days(s.rules.gracePeriodDays) },
									{ label: "Auto-release after approval", value: duration(s.rules.autoReleaseApprovedDelaySeconds) },
									{ label: "Recovery after deadline", value: days(s.rules.recoveryDaysAfterDeadline) },
								]}
							/>
						</Section>
						<Section title="Worker">
							<DetailRows
								rows={[
									{
										label: "Timed worker",
										value: s.worker.enabled ? "Enabled" : <span className="text-attention">Disabled</span>,
									},
									{ label: "Runs every", value: duration(s.worker.intervalSeconds) },
								]}
							/>
							<p className="mt-3 text-[10px] text-muted">
								&ldquo;Run worker now&rdquo; does one pass immediately. It can&apos;t do anything the timed worker wouldn&apos;t.
							</p>
						</Section>
						<Section title="Chain indexer">
							<DetailRows
								rows={[
									{
										label: "Last indexed ledger",
										value: <span className="tabular-nums">#{s.indexer.lastIndexedLedger.toLocaleString("en-US")}</span>,
									},
									{ label: "Cursor updated", value: when(s.indexer.cursorUpdatedAt) },
								]}
							/>
						</Section>
					</div>
				</div>
			)}
		</>
	);
}
