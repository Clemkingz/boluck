import { EscrowLoader } from "@repo/ui/escrow-loader";

/** In-shell loading state for app screens (sidebar and top bar stay put). */
export default function AppLoading() {
	return (
		<div className="grid min-h-[60vh] place-items-center">
			<EscrowLoader label="Loading your workspace" />
		</div>
	);
}
