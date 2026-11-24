"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TX_META } from "@repo/stellar/status";
import { formatDateTime, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES } from "@/lib/api/mock-data";
import { LIVE } from "@/lib/api/config";
import { useNotifications } from "@/features/escrow/hooks";
import { useAppStore } from "@/features/escrow/store";
import { useClickOutside } from "@/components/layouts/WalletMenu";

interface Item {
	key: string;
	bountyId: string;
	text: React.ReactNode;
	at: string;
	unread: boolean;
}

/** Live: `GET /notifications` (polled by StoreHydrator); demo: derived from the simulated transactions. */
function useItems(): { items: Item[]; unread: boolean; onOpen: () => void } {
	const demo = useNotifications();
	const [seen, setSeen] = useState<string | null>(null);
	const live = useAppStore((s) => s.notifications);
	const unreadCount = useAppStore((s) => s.unread);
	const markRead = useAppStore((s) => s.markNotificationsRead);

	if (LIVE)
		return {
			items: live.map((n) => ({ key: n.id, bountyId: n.bountyId, text: n.title, at: n.at, unread: !n.read })),
			unread: unreadCount > 0,
			onOpen: () => void markRead(),
		};
	return {
		items: demo.map((t) => ({
			key: t.hash,
			bountyId: t.bountyId,
			text: (
				<>
					<span className="font-semibold">{ACCOUNT_NAMES[t.from] ?? shortAddress(t.from)}</span> ·{" "}
					{TX_META[t.type].label.toLowerCase()}
				</>
			),
			at: t.timestamp,
			unread: false,
		})),
		unread: demo.length > 0 && demo[0].hash !== seen,
		onOpen: () => demo[0] && setSeen(demo[0].hash),
	};
}

export function NotificationsButton() {
	const { items, unread, onOpen } = useItems();
	const more = useAppStore((s) => s.more.notifications);
	const loadMore = useAppStore((s) => s.loadMoreNotifications);
	const [open, setOpen] = useState(false);
	const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => {
					setOpen((v) => !v);
					onOpen();
				}}
				className="relative grid size-9 place-items-center rounded-[var(--radius-sm)] text-ink transition-colors hover:bg-elevated"
				aria-label={`Notifications${unread ? " (new)" : ""}`}
				aria-expanded={open}
			>
				<Bell className="size-5" />
				{unread && (
					<span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary">
						<span className="absolute inset-0 animate-ping rounded-full bg-primary" />
					</span>
				)}
			</button>
			{open && (
				<div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-pop-in rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
					<p className="border-b border-line px-4 py-3 font-display text-sm font-bold">Updates</p>
					{items.length === 0 ? (
						<p className="px-4 py-8 text-center text-xs text-muted">No updates yet.</p>
					) : (
						<ul className="max-h-96 divide-y divide-line overflow-y-auto">
							{items.map((n) => (
								<li key={n.key}>
									<Link
										href={`/bounties/${n.bountyId}`}
										onClick={() => setOpen(false)}
										className="flex gap-2.5 px-4 py-3 transition-colors hover:bg-elevated"
									>
										<span
											className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.unread ? "bg-primary" : "bg-transparent"}`}
											aria-hidden
										/>
										<span className="min-w-0">
											<span className="block text-xs text-ink">{n.text}</span>
											<span className="mt-0.5 block text-[10px] text-muted">
												{n.bountyId} · {formatDateTime(n.at)}
											</span>
										</span>
									</Link>
								</li>
							))}
							{more && (
								<li>
									<button
										onClick={() => void loadMore()}
										className="w-full px-4 py-3 text-center text-xs font-medium text-primary hover:bg-elevated"
									>
										Load older updates
									</button>
								</li>
							)}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
