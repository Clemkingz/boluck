"use client";

import { Home, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@repo/ui/brand";
import { StatusScreen } from "@repo/ui/status-screen";
import { Button, ButtonLink } from "@repo/ui/button";

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);
	const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest) : undefined;

	return (
		<div className="flex min-h-dvh flex-1 flex-col bg-canvas">
			<header className="container-page flex h-20 items-center">
				<Logo />
			</header>
			<main className="container-page grid flex-1 place-items-center py-12">
				<StatusScreen
					code="500"
					tone="attention"
					title="Something broke on our side."
					description="The page hit an unexpected error. No transaction was signed and no funds moved — your escrow is exactly where you left it."
					actions={
						<>
							<Button size="lg" icon={<RotateCcw />} onClick={retry}>
								Try again
							</Button>
							<ButtonLink href="/" size="lg" variant="secondary" icon={<Home />}>
								Go home
							</ButtonLink>
						</>
					}
					detail={digest && <p className="font-mono text-[10px] text-subtle">Error reference · {digest}</p>}
				/>
			</main>
		</div>
	);
}
