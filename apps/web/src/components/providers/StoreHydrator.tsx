"use client";

import { useEffect } from "react";
import { useAppStore } from "@/features/escrow/store";

/** Loads the persisted demo state from localStorage after the first render. */
export function StoreHydrator() {
	useEffect(() => {
		if (!useAppStore.getState().hydrated) void useAppStore.persist.rehydrate();
	}, []);
	return null;
}
