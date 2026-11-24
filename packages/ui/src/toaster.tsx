"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "./lib/utils";
import { useToastStore, type Toast } from "./toast";

const TONES = {
	success: { icon: CheckCircle2, color: "text-primary", bar: "bg-primary" },
	error: { icon: XCircle, color: "text-attention", bar: "bg-attention" },
	warning: { icon: AlertTriangle, color: "text-review", bar: "bg-review" },
	info: { icon: Info, color: "text-active", bar: "bg-active" },
};

export function Toaster() {
	const toasts = useToastStore((s) => s.toasts);
	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
		>
			{toasts.map((t) => (
				<ToastItem key={t.id} toast={t} />
			))}
		</div>
	);
}

function ToastItem({ toast }: { toast: Toast }) {
	const dismiss = useToastStore((s) => s.dismiss);
	const [paused, setPaused] = useState(false);
	const tone = TONES[toast.tone];
	const Icon = tone.icon;

	useEffect(() => {
		if (paused) return;
		const timer = setTimeout(() => dismiss(toast.id), toast.duration);
		return () => clearTimeout(timer);
	}, [paused, toast.id, toast.duration, dismiss]);

	return (
		<div
			role={toast.tone === "error" ? "alert" : "status"}
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			className="pointer-events-auto relative w-full max-w-sm animate-toast-in overflow-hidden rounded-[var(--radius-lg)] border border-line bg-elevated/95 shadow-[var(--shadow-pop)] backdrop-blur"
		>
			<div className="flex gap-3 p-4 pr-10">
				<Icon className={cn("mt-0.5 size-5 shrink-0", tone.color)} aria-hidden />
				<div className="min-w-0">
					<p className="text-sm font-semibold text-ink">{toast.title}</p>
					{toast.description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.description}</p>}
					{toast.meta && <p className="mt-1.5 truncate font-mono text-[11px] text-primary">{toast.meta}</p>}
					{toast.action && (
						<Link
							href={toast.action.href}
							onClick={() => dismiss(toast.id)}
							className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
						>
							{toast.action.label} →
						</Link>
					)}
				</div>
			</div>
			<button
				onClick={() => dismiss(toast.id)}
				className="absolute top-3 right-3 rounded-md p-1 text-subtle transition-colors hover:bg-surface hover:text-ink"
				aria-label="Dismiss notification"
			>
				<X className="size-3.5" />
			</button>
			<span
				className={cn("absolute bottom-0 left-0 h-0.5 origin-left", tone.bar)}
				style={{
					width: "100%",
					animation: `toast-progress ${toast.duration}ms linear forwards`,
					animationPlayState: paused ? "paused" : "running",
				}}
				aria-hidden
			/>
		</div>
	);
}
