"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { shortAddress } from "@repo/stellar/format";
import { Button } from "@repo/ui/button";
import { Modal } from "@repo/ui/modal";
import { DetailRows, Panel } from "@repo/ui/panel";
import { toast } from "@repo/ui/toast";
import { ApiError } from "@/lib/api/client";
import { admin } from "@/lib/api/admin";
import { BountyRows } from "@/features/bounties/BountyList";
import {
	Addr,
	Cell,
	Empty,
	ErrorNote,
	Explorer,
	Loading,
	PageHeader,
	Pager,
	Row,
	Rows,
	SearchBox,
	Section,
	useApi,
	useQueryState,
	when,
} from "@/components/ui";

const LIMIT = 20;
const COLS = "minmax(0,2fr) 8rem 8rem";

export function WalletList() {
	const q = useQueryState();
	const offset = Number(q.get("offset")) || 0;
	const search = q.get("search");
	const { data, error, loading, reload } = useApi(
		() => admin.wallets({ limit: LIMIT, offset, search: search || undefined }),
		q.key,
	);

	return (
		<>
			<PageHeader
				title="Wallets"
				description="Every wallet that is part of a published bounty. Wallet addresses are the only identity Boluck stores."
			/>
			<div className="mb-4 flex">
				<SearchBox value={search} onChange={(v) => q.set({ search: v })} placeholder="Part of a G… address" />
			</div>
			{error && <ErrorNote message={error} onRetry={reload} />}
			<Panel className="min-w-0 py-2">
				{loading && !data ? (
					<div className="p-4">
						<Loading />
					</div>
				) : data && data.result.length === 0 ? (
					<Empty title="No wallets match" />
				) : data ? (
					<>
						<Rows head={["Wallet", "Issued", "Contributed"]} cols={COLS}>
							{data.result.map((w) => (
								<Row key={w.address} cols={COLS} href={`/wallets/${w.address}`}>
									<div className="min-w-0">
										<Link
											href={`/wallets/${w.address}`}
											className="block truncate font-mono text-xs text-ink hover:text-primary"
											title={w.address}
										>
											{w.address}
										</Link>
									</div>
									<Cell label="Bounties issued">{w.bountiesIssued}</Cell>
									<Cell label="Bounties contributed">{w.bountiesContributed}</Cell>
								</Row>
							))}
						</Rows>
						<div className="pb-2">
							<Pager page={data} offset={offset} limit={LIMIT} onOffset={(o) => q.set({ offset: o })} />
						</div>
					</>
				) : null}
			</Panel>
		</>
	);
}

export function WalletDetail() {
	const { address } = useParams<{ address: string }>();
	const addr = decodeURIComponent(address);
	const { data: w, error, loading, reload } = useApi(() => admin.wallet(addr), addr);
	const [confirm, setConfirm] = useState(false);
	const [busy, setBusy] = useState(false);

	const revoke = async () => {
		setBusy(true);
		try {
			const r = await admin.revokeSessions(addr);
			toast.success("Signed out everywhere", {
				description: `${r.revokedSessions} ${r.revokedSessions === 1 ? "session" : "sessions"} ended. The wallet can sign in again with its own key.`,
			});
			setConfirm(false);
			void reload();
		} catch (e) {
			toast.error("Couldn't revoke sessions", { description: e instanceof ApiError ? e.message : "Try again." });
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<Link href="/wallets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
				<ArrowLeft className="size-4" /> All wallets
			</Link>
			{error && <ErrorNote message={error} onRetry={reload} />}
			{loading && !w && <Loading rows={5} />}
			{w && (
				<>
					<PageHeader
						title={shortAddress(w.address, 6, 6)}
						description="Wallet sessions and every bounty this wallet is part of."
						actions={
							<Button variant="danger" size="sm" icon={<LogOut />} disabled={!w.activeSessions} onClick={() => setConfirm(true)}>
								Sign out everywhere
							</Button>
						}
					/>
					<div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] [&>*]:min-w-0">
						<Section title="Wallet">
							<DetailRows
								rows={[
									{ label: "Address", value: <Addr address={w.address} link={false} /> },
									{ label: "Active sessions", value: w.activeSessions },
									{ label: "All sessions", value: w.sessions },
									{ label: "Last seen", value: when(w.lastSeenAt?.replace(" ", "T").replace(/\+00$/, "Z")) },
									{ label: "Stellar", value: <Explorer href={w.explorerUrl} label="stellar.expert" /> },
								]}
							/>
						</Section>
						<Section title={`Bounties (${w.bounties.length})`} flush>
							{w.bounties.length ? <BountyRows items={w.bounties} /> : <p className="px-4 text-xs text-muted">None.</p>}
						</Section>
					</div>
					<Modal open={confirm} onClose={() => setConfirm(false)} label="Sign this wallet out everywhere">
						<h2 className="font-display text-xl font-bold text-ink">Sign this wallet out everywhere?</h2>
						<p className="mt-2 text-sm text-muted">
							Ends {w.activeSessions} active {w.activeSessions === 1 ? "session" : "sessions"} for{" "}
							<span className="font-mono text-ink">{shortAddress(w.address)}</span>. Nothing on Stellar changes, and the wallet
							can sign in again with its own key.
						</p>
						<div className="mt-6 grid grid-cols-2 gap-3">
							<Button variant="secondary" onClick={() => setConfirm(false)} disabled={busy}>
								Keep sessions
							</Button>
							<Button variant="danger" loading={busy} loadingText="Signing out…" onClick={() => void revoke()}>
								Sign out
							</Button>
						</div>
					</Modal>
				</>
			)}
		</>
	);
}
