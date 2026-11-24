import Image from "next/image";
import { Features } from "@/features/landing/components/Features";
import { Header } from "@/features/landing/components/Header";
import { Hero } from "@/features/landing/components/Hero";
import { PreviewCard } from "@/features/landing/components/PreviewCard";
import { WalletChooser } from "@/features/landing/components/WalletChooser";
import bg from "../../public/images/landing-bg.jpg";

/** PRD Screen 1 — Welcome / landing with the wallet connection panel (Figma "Welcome/Landing page"). */
export default function LandingPage() {
	return (
		<div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
			<Image src={bg} alt="" fill priority placeholder="blur" sizes="100vw" className="-z-20 object-cover object-center" />
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/70 via-canvas/80 to-canvas lg:bg-gradient-to-r lg:from-canvas/85 lg:via-canvas/70 lg:to-canvas/40" />
			<div
				className="pointer-events-none absolute -top-40 -left-40 -z-10 size-[520px] animate-glow rounded-full bg-primary/20 blur-3xl"
				aria-hidden
			/>
			<div
				className="pointer-events-none absolute top-1/3 -right-40 -z-10 size-[460px] animate-glow rounded-full bg-active/15 blur-3xl [animation-delay:2s]"
				aria-hidden
			/>

			<div className="container-page grid flex-1 gap-10 py-8 [&>*]:min-w-0 lg:max-w-[1340px] lg:grid-cols-[minmax(0,1fr)_392px] 3xl:max-w-[1600px] 3xl:grid-cols-[minmax(0,1fr)_440px] 4xl:max-w-[1900px] 4xl:grid-cols-[minmax(0,1fr)_480px] lg:gap-16 lg:py-12">
				<main className="flex flex-col">
					<Header />
					<Hero />
					<PreviewCard />
					<Features />
					<p className="mt-auto pt-14 text-[10px] text-muted">
						Testnet only — Boluck uses testnet USDC. No real funds are ever moved.
					</p>
				</main>
				<div className="scroll-mt-6 lg:sticky lg:top-12 lg:self-start" id="connect">
					<WalletChooser className="animate-fade-up [animation-delay:150ms]" />
				</div>
			</div>
		</div>
	);
}
