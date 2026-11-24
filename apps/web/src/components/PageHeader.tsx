import { ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@repo/ui/misc";

/** Eyebrow + Space Grotesk title + subtitle, as on every app screen. */
export function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	back,
}: {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	back?: { href: string; label: string };
}) {
	return (
		<div className="mb-6 animate-fade-up lg:mb-8">
			{back && <BackLink {...back} />}
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="min-w-0">
					{eyebrow && <Eyebrow className="mb-2 sm:mb-3">{eyebrow}</Eyebrow>}
					<h1 className="font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-ink sm:text-4xl">{title}</h1>
					{description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{description}</p>}
				</div>
				{actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
			</div>
		</div>
	);
}

export function BackLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="group mb-6 inline-flex items-center gap-2 text-[11px] text-muted transition-colors hover:text-ink sm:mb-8"
		>
			<ArrowDownLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
			{label}
		</Link>
	);
}
