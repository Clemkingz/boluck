import { Code2, FileCheck2, LayoutGrid, Palette, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { IconTile } from "@repo/ui/panel";
import type { BountyIcon as BountyIconName } from "@repo/stellar/bounty";

const ICONS: Record<BountyIconName, LucideIcon> = {
	layout: LayoutGrid,
	code: Code2,
	sparkle: Sparkles,
	doc: FileCheck2,
	shield: ShieldCheck,
	palette: Palette,
};

export function BountyIcon({
	icon,
	size = "sm",
	tone = "elevated",
}: {
	icon: BountyIconName;
	size?: "sm" | "md" | "lg";
	tone?: "deep" | "elevated";
}) {
	const Icon = ICONS[icon] ?? LayoutGrid;
	return (
		<IconTile size={size} tone={tone} className={tone === "elevated" ? "text-primary" : undefined}>
			<Icon />
		</IconTile>
	);
}
