"use client";

/** Building blocks for the console screens, on the shared design system (@repo/ui tokens and components). */
import { AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, RotateCw, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { BountyStatus } from "@repo/stellar/bounty";
import { formatDateTime, shortAddress } from "@repo/stellar/format";
import { STATUS_META } from "@repo/stellar/status";
import { Badge, type Tone } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { CopyButton, EmptyState, Skeleton } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { cn } from "@repo/ui/lib/utils";
import { ApiError } from "@/lib/api/client";
import type { TxStatusFilter } from "@/lib/api/admin";
import type { Page } from "@/lib/api/types";

/* ---------- data ---------- */

/** Loads `fn` when `key` changes; `reload` refetches. Errors keep the last data on screen. */
export function useApi<T>(fn: () => Promise<T>, key: string) {
	const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
	const fnRef = useRef(fn);
	useEffect(() => {
		fnRef.current = fn;
	});
	const load = useCallback(async () => {
		setState((s) => ({ ...s, loading: true, error: undefined }));
		try {
			const data = await fnRef.current();
			setState({ data, loading: false });
		} catch (e) {
			setState((s) => ({
				...s,
				loading: false,
				error: e instanceof ApiError || e instanceof Error ? e.message : "Couldn't load this.",
			}));
		}
	}, []);
	useEffect(() => {
		void load();
	}, [load, key]);
	return { ...state, reload: load };
}

/** Query-string state for list screens (filters survive reloads and can be shared). */
export function useQueryState() {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const get = (k: string) => params.get(k) ?? "";
	const set = (patch: Record<string, string | number | null | undefined>) => {
		const next = new URLSearchParams(params.toString());
		for (const [k, v] of Object.entries(patch)) {
			if (v === null || v === undefined || v === "" || v === 0) next.delete(k);
			else next.set(k, String(v));
		}
		if (!("offset" in patch)) next.delete("offset"); // a new filter starts on page 1
		const q = next.toString();
		router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
	};
	return { get, set, key: params.toString() };
}

/* ---------- layout ---------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0">
				<h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink sm:text-3xl">{title}</h1>
				{description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
			</div>
			{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
		</div>
	);
}

/** A titled panel. `flush` lets lists run edge to edge while the title keeps its padding. */
export function Section({
	title,
	action,
	children,
	className,
	flush,
}: {
	title: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	flush?: boolean;
}) {
	return (
		<Panel className={cn("min-w-0 py-4 sm:py-6", flush ? "px-0" : "px-4 sm:px-6", className)}>
			<div className={cn("mb-4 flex flex-wrap items-center justify-between gap-2", flush && "px-4 sm:px-6")}>
				<h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">{title}</h2>
				{action}
			</div>
			{children}
		</Panel>
	);
}

export function Stat({
	label,
	value,
	hint,
	tone,
	href,
}: {
	label: string;
	value: ReactNode;
	hint?: ReactNode;
	tone?: "attention" | "review" | "primary";
	href?: string;
}) {
	const body = (
		<>
			<p className="text-[11px] font-medium text-muted">{label}</p>
			<p
				className={cn(
					"mt-2 font-display text-2xl font-bold tabular-nums",
					tone === "attention"
						? "text-attention"
						: tone === "review"
							? "text-review"
							: tone === "primary"
								? "text-primary"
								: "text-ink",
				)}
			>
				{value}
			</p>
			{hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
		</>
	);
	const cls = "block min-w-0 rounded-[var(--radius-md)] border border-line bg-surface p-4 transition-colors";
	return href ? (
		<Link href={href} className={cn(cls, "hover:border-primary/60 hover:bg-elevated/40")}>
			{body}
		</Link>
	) : (
		<div className={cls}>{body}</div>
	);
}

/* ---------- values ---------- */

/** Decimal-string amount in the escrow asset ("1.5" → "1.50 USDC"). Display only; never used for maths. */
export function Amount({ value, asset = "USDC" }: { value: string | null | undefined; asset?: string }) {
	if (value === null || value === undefined) return <span className="text-muted">—</span>;
	const code = asset.split(":")[0];
	const n = Number(value);
	const text = Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 }) : value;
	return (
		<span className="tabular-nums">
			{text} <span className="text-muted">{code}</span>
		</span>
	);
}

export const when = (iso: string | null | undefined) => (iso ? formatDateTime(iso) : "—");

/** A wallet address: short form, links to its wallet page, copyable. */
export function Addr({ address, link = true }: { address: string | null | undefined; link?: boolean }) {
	if (!address) return <span className="text-muted">—</span>;
	return (
		<span className="inline-flex min-w-0 items-center gap-1 font-mono text-xs">
			{link ? (
				<Link href={`/wallets/${address}`} className="truncate text-ink hover:text-primary" title={address}>
					{shortAddress(address)}
				</Link>
			) : (
				<span className="truncate" title={address}>
					{shortAddress(address)}
				</span>
			)}
			<CopyButton value={address} label="Copy address" className="p-0.5 [&_svg]:size-3" />
		</span>
	);
}

export function Explorer({ href, label = "Explorer" }: { href: string | null | undefined; label?: string }) {
	if (!href) return null;
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
		>
			{label} <ExternalLink className="size-3" />
		</a>
	);
}

export function StatusBadge({ status }: { status: string }) {
	const meta = STATUS_META[status as BountyStatus];
	return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? status}</Badge>;
}

const TX_TONE: Record<TxStatusFilter, Tone> = {
	prepared: "neutral",
	pending: "review",
	confirmed: "highlight",
	failed: "attention",
	expired: "neutral",
};
export function TxStatusBadge({ status, stuck }: { status: string; stuck?: boolean }) {
	if (stuck)
		return (
			<Badge tone="attention" pulse>
				Stuck
			</Badge>
		);
	return (
		<Badge tone={TX_TONE[status as TxStatusFilter] ?? "neutral"} pulse={status === "pending"}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</Badge>
	);
}

/** "request_revision" → "Request revision". */
export const humanize = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, " ");

/** Unknown-shaped details from the API (failure, rejection) as readable text. */
export const describe = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "string" ? v : JSON.stringify(v));

/* ---------- lists ---------- */

/**
 * Rows that read as a table when the list has room and stack as cards when it doesn't (no sideways scrolling at
 * 280px). `cols` sets the table grid; each cell can carry a `label` shown only when stacked.
 */
export function Rows({ head, cols, children }: { head: string[]; cols: string; children: ReactNode }) {
	return (
		// A container query, not the screen width: the same list sits full-width on its own page but in a narrow column
		// on detail pages, and should only become a table when it has room (48rem).
		<div className="@container min-w-0">
			<div
				className="hidden gap-4 border-b border-line px-4 pb-3 text-[10px] font-semibold tracking-wide text-muted uppercase @3xl:grid"
				style={{ gridTemplateColumns: cols }}
			>
				{head.map((h) => (
					<span key={h}>{h}</span>
				))}
			</div>
			<ul className="divide-y divide-line">{children}</ul>
		</div>
	);
}

export function Row({ cols, href, children }: { cols: string; href?: string; children: ReactNode }) {
	const router = useRouter();
	return (
		<li
			className={cn(
				"grid min-w-0 grid-cols-1 gap-2 px-4 py-3.5 text-sm @3xl:[grid-template-columns:var(--cols)] @3xl:items-center @3xl:gap-4",
				href && "cursor-pointer transition-colors hover:bg-elevated/40",
			)}
			style={{ "--cols": cols } as React.CSSProperties}
			onClick={href ? (e) => !(e.target as HTMLElement).closest("a,button") && router.push(href) : undefined}
		>
			{children}
		</li>
	);
}

/** A cell with a label that only shows when rows are stacked (phones). */
export function Cell({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
	return (
		<div className={cn("flex min-w-0 items-center justify-between gap-3 @3xl:block", className)}>
			{label && <span className="shrink-0 text-[10px] text-muted @3xl:hidden">{label}</span>}
			<div className="min-w-0 text-right @3xl:text-left">{children}</div>
		</div>
	);
}

export function Pager<T>({
	page,
	offset,
	limit,
	onOffset,
}: {
	page?: Page<T>;
	offset: number;
	limit: number;
	onOffset: (o: number) => void;
}) {
	const meta = page?.paginationMeta;
	if (!meta || meta.totalCount <= limit) return null;
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 pt-4 text-xs text-muted">
			<span>
				{offset + 1}–{offset + meta.pageCount} of {meta.totalCount}
			</span>
			<span className="flex gap-2">
				<Button
					variant="secondary"
					size="sm"
					icon={<ChevronLeft />}
					disabled={!meta.previousPage}
					onClick={() => onOffset(Math.max(0, offset - limit))}
				>
					Previous
				</Button>
				<Button
					variant="secondary"
					size="sm"
					iconRight={<ChevronRight />}
					disabled={!meta.nextPage}
					onClick={() => onOffset(offset + limit)}
				>
					Next
				</Button>
			</span>
		</div>
	);
}

/* ---------- filters ---------- */

export function SearchBox({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	const [text, setText] = useState(value);
	// Debounced: a request per keystroke would hit the API's rate limit.
	useEffect(() => {
		const t = setTimeout(() => text !== value && onChange(text.trim()), 350);
		return () => clearTimeout(t);
	}, [text, value, onChange]);
	return (
		<label className="relative block min-w-0 flex-1 basis-56">
			<span className="sr-only">{placeholder}</span>
			<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
			<input
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder={placeholder}
				className="h-10 w-full rounded-[var(--radius-sm)] border border-line bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-xs placeholder:text-muted focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none"
			/>
		</label>
	);
}

export function Select({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: { value: string; label: string }[];
}) {
	return (
		<label className="block min-w-0 flex-1 basis-40 sm:flex-none">
			<span className="sr-only">{label}</span>
			<select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="h-10 w-full rounded-[var(--radius-sm)] border border-line bg-canvas px-3 text-sm text-ink focus:border-primary focus:outline-none sm:w-48"
			>
				<option value="">{label}</option>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</label>
	);
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
	return (
		<label className="flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-line bg-canvas px-3 text-sm text-ink has-[:checked]:border-primary/70">
			<input
				type="checkbox"
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				className="accent-[var(--color-primary)]"
			/>
			{label}
		</label>
	);
}

/* ---------- states ---------- */

export function Loading({ rows = 5 }: { rows?: number }) {
	return (
		<div className="space-y-3" aria-busy aria-label="Loading">
			{Array.from({ length: rows }).map((_, i) => (
				<Skeleton key={i} className="h-12" />
			))}
		</div>
	);
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<div
			className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-attention/60 bg-attention/10 p-4 text-sm text-ink"
			role="alert"
		>
			<AlertTriangle className="size-4 shrink-0 text-attention" />
			<span className="min-w-0 flex-1 break-words">{message}</span>
			{onRetry && (
				<Button size="sm" variant="secondary" icon={<RotateCw />} onClick={onRetry}>
					Retry
				</Button>
			)}
		</div>
	);
}

export function Empty({ title, description }: { title: string; description?: string }) {
	return <EmptyState icon={<Search />} title={title} description={description ?? "Try another search or filter."} />;
}
