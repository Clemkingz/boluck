import { ArrowLeft, Compass } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@repo/ui/brand";
import { StatusScreen } from "@repo/ui/status-screen";
import { ButtonLink } from "@repo/ui/button";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-1 flex-col bg-canvas">
			<header className="container-page flex h-20 items-center">
				<Logo />
			</header>
			<main className="container-page grid flex-1 place-items-center py-12">
				<StatusScreen
					code="404"
					title="This bounty trail goes cold."
					description="The page you're looking for doesn't exist or has moved. Your escrow and payouts are safe — nothing has changed."
					actions={
						<>
							<ButtonLink href="/overview" size="lg" icon={<ArrowLeft />}>
								Back to workspace
							</ButtonLink>
							<ButtonLink href="/bounties" size="lg" variant="secondary" icon={<Compass />}>
								Explore bounties
							</ButtonLink>
						</>
					}
				/>
			</main>
		</div>
	);
}
