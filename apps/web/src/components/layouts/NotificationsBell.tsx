"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TX_META } from "@repo/stellar/status";
import { formatDateTime, shortAddress } from "@repo/stellar/format";
import { ACCOUNT_NAMES } from "@/lib/api/mock-data";
import { useNotifications } from "@/features/escrow/hooks";
import { useClickOutside } from "@/components/layouts/WalletMenu";

export function NotificationsButton() {
	const items = useNotifications();
	const [open, setOpen] = useState(false);
	const [seen, setSeen] = useState<string | null>(null);
	const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
	const unread = items.length > 0 && items[0].hash !== seen;

	return (
		<div className="relative" ref={ref}>
			<button
				onClick={() => {
					setOpen((v) => !v);
					if (items[0]) setSeen(items[0].hash);
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
							{items.map((t) => (
								<li key={t.hash}>
									<Link
										href={`/bounties/${t.bountyId}`}
										onClick={() => setOpen(false)}
										className="block px-4 py-3 transition-colors hover:bg-elevated"
									>
										<p className="text-xs text-ink">
											<span className="font-semibold">{ACCOUNT_NAMES[t.from] ?? shortAddress(t.from)}</span> ·{" "}
											{TX_META[t.type].label.toLowerCase()}
										</p>
										<p className="mt-0.5 text-[10px] text-muted">
											{t.bountyId} · {formatDateTime(t.timestamp)}
										</p>
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
