import { Logo } from "@repo/ui/brand";

export function Header() {
	return (
		<header className="flex flex-wrap items-center justify-between gap-4 lg:max-w-[708px] 3xl:max-w-[900px]">
			<Logo />
			<span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-line bg-canvas/80 px-3 py-2 text-xs text-ink sm:text-sm">
				<span className="size-1.5 rounded-full bg-primary" /> Stellar Testnet · USDC
			</span>
		</header>
	);
}
