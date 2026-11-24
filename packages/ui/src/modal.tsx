"use client";

import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./lib/utils";

export function Modal({
	open,
	onClose,
	onBack,
	label,
	children,
	dismissible = true,
	className,
}: {
	open: boolean;
	onClose: () => void;
	onBack?: () => void;
	/** Accessible name for the dialog. */
	label: string;
	children: ReactNode;
	dismissible?: boolean;
	className?: string;
}) {
	const panel = useRef<HTMLDivElement>(null);
	// Portals need `document`: render nothing during SSR, even if `open` starts true.
	const mounted = useSyncExternalStore(
		subscribeNoop,
		() => true,
		() => false,
	);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissible && onClose();
		document.addEventListener("keydown", onKey);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		panel.current?.focus();
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = overflow;
		};
	}, [open, dismissible, onClose]);

	if (!open || !mounted) return null;

	// Portal to <body>: ancestors with backdrop-filter/transform would otherwise
	// become the containing block for `position: fixed`.
	return createPortal(
		<div
			className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
			role="dialog"
			aria-modal
			aria-label={label}
		>
			<div
				className="absolute inset-0 animate-fade-in bg-canvas/70 backdrop-blur-md"
				onClick={() => dismissible && onClose()}
				aria-hidden
			/>
			<div
				ref={panel}
				tabIndex={-1}
				className={cn(
					"relative max-h-[92dvh] w-full max-w-[506px] animate-sheet-up overflow-y-auto rounded-t-[var(--radius-xl)] border border-line bg-surface p-6 shadow-[var(--shadow-pop)] outline-none sm:animate-pop-in sm:rounded-[var(--radius-lg)] sm:p-8",
					className,
				)}
			>
				{(onBack || dismissible) && (
					<div className="mb-5 flex items-center justify-between">
						{onBack ? (
							<button
								onClick={onBack}
								className="-ml-1 rounded-md p-1 text-muted transition-colors hover:text-ink"
								aria-label="Back"
							>
								<ArrowLeft className="size-5" />
							</button>
						) : (
							<span />
						)}
						{dismissible && (
							<button
								onClick={onClose}
								className="-mr-1 rounded-md p-1 text-muted transition-colors hover:text-ink"
								aria-label="Close"
							>
								<X className="size-5" />
							</button>
						)}
					</div>
				)}
				{children}
			</div>
		</div>,
		document.body,
	);
}

const subscribeNoop = () => () => {};
