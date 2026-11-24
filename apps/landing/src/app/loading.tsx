import { EscrowLoader } from "@repo/ui/escrow-loader";

export default function Loading() {
	return (
		<div className="grid min-h-dvh flex-1 place-items-center bg-canvas px-6">
			<EscrowLoader label="Loading Boluck" />
		</div>
	);
}
