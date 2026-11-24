export function Hero() {
	return (
		<section className="stagger mt-14 max-w-[690px] sm:mt-20 3xl:max-w-[900px]">
			<p className="font-display text-base font-bold text-primary">Bounty escrow on Stellar</p>
			<h1 className="mt-6 font-display text-[34px] leading-[1.25] font-bold tracking-[-0.02em] text-ink sm:text-[40px] sm:leading-[52px] 3xl:text-[56px] 3xl:leading-[68px] 4xl:text-[68px] 4xl:leading-[80px]">
				Get paid for work
				<br />
				that&apos;s <span className="text-gradient">already funded.</span>
			</h1>
			<p className="mt-6 text-lg leading-relaxed font-medium text-muted sm:text-2xl sm:leading-10 3xl:text-[28px] 3xl:leading-[46px]">
				Boluck lets teams post bounties, lock the reward in escrow on Stellar, and release it to the contributor the moment their
				work is approved.
			</p>
			<a
				href="#connect"
				className="mt-8 inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 text-[15px] font-medium text-on-primary transition-colors hover:bg-primary-strong lg:hidden"
			>
				Connect your wallet ↓
			</a>
		</section>
	);
}
