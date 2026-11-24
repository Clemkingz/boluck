import { EscrowLoader } from "@repo/ui/escrow-loader";

/** Full-screen loading page shown while a route segment streams in. */
export default function Loading() {
	return (
		<div className="grid min-h-dvh flex-1 place-items-center bg-canvas px-6">
			<EscrowLoader />
		</div>
	);
}
