"use client";

import { Check, Download, Eye, FileCheck2, Globe, ShieldCheck, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Logo } from "@repo/ui/brand";
import { Button } from "@repo/ui/button";
import { Checkbox, Field, Input } from "@repo/ui/field";
import { Modal } from "@repo/ui/modal";
import { walletName } from "@/features/wallet/wallets";
import { shortAddress } from "@repo/stellar/format";
import { DEMO_ACCOUNTS } from "@/lib/api/mock-data";
import type { Role, WalletId } from "@repo/stellar/bounty";
import { cn, sleep } from "@/lib/utils";

const STEP_LABELS = ["Bounty", "Wallet", "Testnet", "Connect"];

/**
 * Simulated wallet onboarding from the design ("Connect Wallet 1–4"):
 * install → create wallet → switch to Testnet → approve connection.
 * Wallets that are already "installed" start at the Connect step.
 */
export function WalletFlowModal({
	open,
	wallet,
	role,
	startAt = 0,
	onClose,
	onConnected,
}: {
	open: boolean;
	wallet: WalletId;
	role: Role;
	startAt?: number;
	onClose: () => void;
	onConnected: () => Promise<void> | void;
}) {
	const [step, setStep] = useState(startAt);
	const [created, setCreated] = useState(false);
	const name = walletName(wallet);
	const account = DEMO_ACCOUNTS[role];

	const close = () => {
		setStep(startAt);
		onClose();
	};

	return (
		<Modal
			open={open}
			onClose={close}
			onBack={step > startAt ? () => setStep((s) => s - 1) : undefined}
			label={`Connect ${name}`}
		>
			{startAt === 0 && <Steps current={step} />}

			<div key={step} className="animate-fade-up">
				{step === 0 && <InstallStep name={name} onDone={() => setStep(1)} />}
				{step === 1 && (
					<CreateWalletStep
						name={name}
						onDone={() => {
							setCreated(true);
							setStep(2);
						}}
					/>
				)}
				{step === 2 && <NetworkStep name={name} created={created ? account.address : undefined} onDone={() => setStep(3)} />}
				{step === 3 && (
					<ApproveStep
						name={name}
						accountName={account.name}
						initials={account.initials}
						address={account.address}
						onReject={close}
						onApprove={async () => {
							await onConnected();
							setStep(startAt);
						}}
					/>
				)}
			</div>

			<p className="mt-8 text-center text-[10px] text-muted">
				Walkthrough only — nothing is installed and no real wallet is created.{" "}
				<a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
					Get the real {name}
				</a>
			</p>
		</Modal>
	);
}

function Steps({ current }: { current: number }) {
	return (
		<ol className="mb-8 grid grid-cols-4 gap-3" aria-label="Setup progress">
			{STEP_LABELS.map((label, i) => (
				<li key={label} className="space-y-2.5" aria-current={i === current ? "step" : undefined}>
					<span className="block h-1.5 overflow-hidden rounded-full bg-muted/70">
						<span
							className={cn(
								"block h-full rounded-full transition-[width,background-color] duration-500",
								i < current ? "w-full bg-primary" : i === current ? "w-full bg-deep" : "w-0",
							)}
						/>
					</span>
					<span
						className={cn(
							"block text-[10px] font-medium tracking-wide uppercase sm:text-xs",
							i <= current ? "text-ink" : "text-muted",
						)}
					>
						{label}
					</span>
				</li>
			))}
		</ol>
	);
}

function WalletAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
	return (
		<span
			className={cn(
				"grid shrink-0 place-items-center rounded-[var(--radius-sm)] bg-deep font-semibold text-ink",
				size === "md" ? "size-12 text-lg" : "size-5 text-[10px]",
			)}
		>
			{name[0]}
		</span>
	);
}

function InstallStep({ name, onDone }: { name: string; onDone: () => void }) {
	const [busy, setBusy] = useState(false);
	return (
		<div>
			<p className="text-sm text-muted">Chrome Web Store</p>
			<div className="mt-4 flex items-center gap-3">
				<WalletAvatar name={name} />
				<div>
					<p className="font-display font-bold text-ink">{name}</p>
					<p className="text-[10px] text-muted">stellar.org · Featured</p>
					<p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
						<span className="flex text-review" aria-hidden>
							{Array.from({ length: 5 }).map((_, i) => (
								<Star key={i} className="size-3 fill-current" />
							))}
						</span>
						4.5 · 200,000+ users
					</p>
				</div>
			</div>
			<p className="mt-5 text-[15px] leading-relaxed text-muted">
				{name} is a free, non-custodial wallet for Stellar made by the Stellar Development Foundation. Your keys stay on your
				device.
			</p>
			<ul className="mt-5 space-y-3 text-sm text-ink">
				{["Free to install", "Works with Stellar apps", "Supports Test Net"].map((f) => (
					<li key={f} className="flex items-center gap-2.5">
						<Check className="size-4 text-primary" /> {f}
					</li>
				))}
			</ul>
			<Button
				className="mt-7"
				fullWidth
				size="lg"
				icon={<Download />}
				loading={busy}
				loadingText="Adding to Chrome…"
				onClick={async () => {
					setBusy(true);
					await sleep(1100);
					setBusy(false);
					onDone();
				}}
			>
				Add to Chrome
			</Button>
		</div>
	);
}

function CreateWalletStep({ name, onDone }: { name: string; onDone: () => void }) {
	const [password, setPassword] = useState("");
	const [saved, setSaved] = useState(false);
	const [touched, setTouched] = useState(false);
	const [busy, setBusy] = useState(false);
	const error = password.length < 8 ? "Use at least 8 characters." : undefined;

	async function submit(e: FormEvent) {
		e.preventDefault();
		setTouched(true);
		if (error || !saved) return;
		setBusy(true);
		await sleep(1200);
		setBusy(false);
		onDone();
	}

	return (
		<form onSubmit={submit} noValidate>
			<WalletAvatar name={name} />
			<h2 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em] text-ink">Welcome to {name}</h2>
			<p className="mt-2 text-[15px] leading-relaxed text-muted">Create a password to protect your new wallet on this device.</p>
			<Field label="New Password" htmlFor="wallet-password" error={touched ? error : undefined} className="mt-6">
				<Input
					id="wallet-password"
					type="password"
					autoComplete="new-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="••••••••••••"
					aria-invalid={touched && !!error}
				/>
			</Field>
			<label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
				<Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5" />
				<span>
					I&apos;ve saved my secret recovery phrase somewhere safe. (In the real app you&apos;ll be shown 12 words to write down.)
				</span>
			</label>
			{touched && !saved && (
				<p className="mt-2 animate-fade-in text-xs text-attention">Confirm you&apos;ve saved your recovery phrase.</p>
			)}
			<Button type="submit" className="mt-7" fullWidth size="lg" loading={busy} loadingText="Creating wallet…">
				Create Wallet
			</Button>
			<p className="mt-4 text-center text-xs text-muted">I already have a wallet — import it</p>
		</form>
	);
}

function NetworkStep({ name, created, onDone }: { name: string; created?: string; onDone: () => void }) {
	const [network, setNetwork] = useState<"main" | "test">("test");
	return (
		<div>
			{created && (
				<p className="mb-6 flex animate-pop-in items-center gap-2 rounded-[var(--radius-sm)] bg-deep/80 px-4 py-2 text-xs text-ink">
					<Check className="size-4 text-primary" /> Wallet created · {shortAddress(created, 5, 5)}
				</p>
			)}
			<h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Choose a network</h2>
			<p className="mt-2 text-[15px] leading-relaxed text-muted">
				{name} starts on Main Net. Boluck runs on Test Net, so switch it over.
			</p>
			<div className="mt-6 space-y-4" role="radiogroup" aria-label="Network">
				{[
					{ id: "main" as const, label: "Main Net", sub: "Real funds" },
					{ id: "test" as const, label: "Test Net", sub: "Free test funds — used by Boluck" },
				].map((n) => {
					const selected = network === n.id;
					return (
						<button
							key={n.id}
							type="button"
							role="radio"
							aria-checked={selected}
							onClick={() => setNetwork(n.id)}
							className={cn(
								"flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition-colors",
								selected ? "border-primary bg-deep/70" : "border-line bg-surface hover:border-subtle",
							)}
						>
							<Globe className={cn("size-6", selected ? "text-primary" : "text-muted")} />
							<span className="flex-1">
								<span className="block font-semibold text-ink">{n.label}</span>
								<span className="block text-[10px] text-muted">{n.sub}</span>
							</span>
							<span
								className={cn(
									"grid size-4 place-items-center rounded-full border",
									selected ? "border-ink bg-ink" : "border-muted",
								)}
							>
								{selected && <span className="size-2 rounded-full bg-primary" />}
							</span>
						</button>
					);
				})}
			</div>
			{network === "main" && (
				<p className="mt-3 animate-fade-in text-xs text-review">Boluck only works on Test Net. Switch over to continue.</p>
			)}
			<Button className="mt-6" fullWidth size="lg" disabled={network !== "test"} onClick={onDone}>
				Continue to Boluck
			</Button>
		</div>
	);
}

function ApproveStep({
	name,
	accountName,
	initials,
	address,
	onReject,
	onApprove,
}: {
	name: string;
	accountName: string;
	initials: string;
	address: string;
	onReject: () => void;
	onApprove: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);
	return (
		<div>
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-2 text-sm font-medium text-ink">
					<WalletAvatar name={name} size="sm" /> {name}
				</span>
				<span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">TestNet</span>
			</div>
			<div className="mt-8 flex flex-col items-center text-center">
				<Logo href={null} size="sm" />
				<h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-ink">Boluck wants to connect</h2>
			</div>
			<div className="mt-6 rounded-[var(--radius-md)] border border-line bg-canvas/40 p-4">
				<p className="text-xs text-ink">This will allow Boluck to:</p>
				<ul className="mt-3 space-y-2.5 text-sm font-medium text-ink">
					<li className="flex items-center gap-2.5">
						<Eye className="size-4 text-primary" /> See your public address
					</li>
					<li className="flex items-center gap-2.5">
						<FileCheck2 className="size-4 text-primary" /> Ask you to approve transactions
					</li>
					<li className="flex items-center gap-2.5">
						<ShieldCheck className="size-4 text-primary" /> It can never move funds without you
					</li>
				</ul>
			</div>
			<div className="mt-4 flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-canvas/40 p-4">
				<span className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-line bg-elevated text-sm font-semibold text-ink">
					{initials}
				</span>
				<span className="flex-1">
					<span className="block text-sm font-medium text-ink">{accountName}</span>
					<span className="block font-mono text-xs text-muted">{shortAddress(address)}</span>
				</span>
				<Check className="size-5 text-primary" />
			</div>
			<div className="mt-6 grid grid-cols-2 gap-4">
				<Button variant="secondary" size="lg" onClick={onReject} disabled={busy}>
					Reject
				</Button>
				<Button
					size="lg"
					loading={busy}
					loadingText="Connecting…"
					onClick={async () => {
						setBusy(true);
						await sleep(900);
						await onApprove();
						setBusy(false);
					}}
				>
					Connect
				</Button>
			</div>
		</div>
	);
}
