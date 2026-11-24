import Image from "next/image";
import mark from "./assets/boluck-mark.png";
import Link from "next/link";
import { cn } from "./lib/utils";

/** Boluck mark + "boluck." wordmark (DM Sans 800, mint "o" and dot) from the design system. */
export function Logo({
	href = "/",
	size = "md",
	className,
	markOnly,
}: {
	href?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
	markOnly?: boolean;
}) {
	const px = size === "sm" ? 28 : size === "lg" ? 48 : 40;
	const content = (
		<>
			<Image src={mark} alt="" width={px} height={px} priority className="shrink-0" />
			{!markOnly && (
				<span
					className={cn(
						"font-extrabold tracking-[-0.02em] text-ink",
						size === "sm" && "text-lg",
						size === "md" && "text-2xl",
						size === "lg" && "text-[28px]",
					)}
				>
					b<span className="text-primary">o</span>luck<span className="text-primary">.</span>
				</span>
			)}
		</>
	);
	const classes = cn("inline-flex items-center gap-1.5 rounded-md", className);
	if (!href) return <span className={classes}>{content}</span>;
	return (
		<Link href={href} className={classes} aria-label="Boluck home">
			{content}
		</Link>
	);
}
