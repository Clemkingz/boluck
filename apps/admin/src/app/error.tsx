"use client";

import { Button } from "@repo/ui/button";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
	return (
		<div className="grid min-h-dvh place-items-center p-6 text-center">
			<div>
				<h1 className="font-display text-xl font-bold text-ink">Something went wrong in the console.</h1>
				<p className="mt-2 text-sm text-muted">Nothing on Stellar was changed.</p>
				<Button className="mt-5" onClick={retry}>
					Try again
				</Button>
			</div>
		</div>
	);
}
