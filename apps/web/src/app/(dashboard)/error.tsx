"use client";

import { LayoutGrid, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { StatusScreen } from "@repo/ui/status-screen";
import { Button, ButtonLink } from "@repo/ui/button";

/** Errors inside the workspace keep the sidebar and top bar on screen. */
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);
	const message = error instanceof Error ? error.message : undefined;

	return (
		<div className="grid min-h-[65vh] place-items-center py-10">
			<StatusScreen
				code="Oops"
				tone="attention"
				title="This screen couldn't load."
				description="Something went wrong while showing this part of your workspace. No transaction was signed and your escrow is unchanged."
				actions={
					<>
						<Button size="lg" icon={<RotateCcw />} onClick={retry}>
							Try again
						</Button>
						<ButtonLink href="/overview" size="lg" variant="secondary" icon={<LayoutGrid />}>
							Back to overview
						</ButtonLink>
					</>
				}
				detail={
					message && (
						<p className="max-w-md rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 font-mono text-[10px] text-subtle">
							{message}
						</p>
					)
				}
			/>
		</div>
	);
}
