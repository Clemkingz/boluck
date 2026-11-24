"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info" | "warning";

export interface Toast {
	id: number;
	tone: ToastTone;
	title: string;
	description?: string;
	/** Monospace detail, e.g. a transaction reference. */
	meta?: string;
	action?: { label: string; href: string };
	duration: number;
}

interface ToastState {
	toasts: Toast[];
	push: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => number;
	dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
	toasts: [],
	push: (t) => {
		const id = nextId++;
		// Newest first, keep at most 4 on screen.
		set((s) => ({ toasts: [{ duration: t.tone === "error" ? 7000 : 4500, ...t, id }, ...s.toasts].slice(0, 4) }));
		return id;
	},
	dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

type ToastInput = Omit<Toast, "id" | "duration" | "tone" | "title"> & { duration?: number };

/** Imperative helpers usable from anywhere (stores, event handlers). */
export const toast = {
	success: (title: string, opts: ToastInput = {}) => useToastStore.getState().push({ tone: "success", title, ...opts }),
	error: (title: string, opts: ToastInput = {}) => useToastStore.getState().push({ tone: "error", title, ...opts }),
	info: (title: string, opts: ToastInput = {}) => useToastStore.getState().push({ tone: "info", title, ...opts }),
	warning: (title: string, opts: ToastInput = {}) => useToastStore.getState().push({ tone: "warning", title, ...opts }),
};
