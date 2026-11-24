import { FileCheck2, Lock, ShieldCheck } from "lucide-react";
import { IconTile } from "@repo/ui/panel";
import { Reveal } from "@repo/ui/reveal";

const FEATURES = [
	{
		icon: <Lock />,
		title: "Reward locked before work starts",
		body: "Issuers deposit the full reward into an escrow smart contract. Contributors can check it's there first.",
	},
	{
		icon: <ShieldCheck />,
		title: "Only the right wallet can act",
		body: "Only the issuer approves, only the assigned contributor submits — enforced by the contract, not trust.",
	},
	{
		icon: <FileCheck2 />,
		title: "Every step on the record",
		body: "Funding, approval, payout and refunds each leave a transaction you can verify on Stellar.",
	},
];

export function Features() {
	return (
		<ul className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:max-w-[730px] 3xl:max-w-[900px]">
			{FEATURES.map((f, i) => (
				<Reveal as="li" key={f.title} delay={i * 120} className="group">
					<IconTile
						tone="elevated"
						className="text-primary transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]"
					>
						{f.icon}
					</IconTile>
					<h2 className="mt-4 text-base font-semibold text-ink">{f.title}</h2>
					<p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
				</Reveal>
			))}
		</ul>
	);
}
