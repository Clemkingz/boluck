"use client";

import { useEffect } from "react";
import { useAppStore } from "@/features/escrow/store";
import { LIVE } from "@/lib/api/config";

/** The guide's polling interval (there are no WebSockets). */
const SYNC_EVERY = 30_000;

/**
 * Loads the persisted state after the first render. Live mode then keeps the other party's changes coming in:
 * a refresh every 30 s while the tab is visible, and when the tab regains focus.
 */
export function StoreHydrator() {
	const connected = useAppStore((s) => !!s.wallet && !!s.session);
	const refresh = useAppStore((s) => s.refresh);

	useEffect(() => {
		if (!useAppStore.getState().hydrated) void useAppStore.persist.rehydrate();
	}, []);

	useEffect(() => {
		if (!LIVE || !connected) return;
		const tick = () => {
			// Skip while a transaction is in flight so the dialog isn't racing a refresh.
			if (document.visibilityState === "visible" && useAppStore.getState().tx.stage === "idle") void refresh();
		};
		const timer = setInterval(tick, SYNC_EVERY);
		const onFocus = () => tick();
		window.addEventListener("focus", onFocus);
		return () => {
			clearInterval(timer);
			window.removeEventListener("focus", onFocus);
		};
	}, [connected, refresh]);

	return null;
}
