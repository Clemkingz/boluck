"use client";

import { ArrowRight, Check, CircleDollarSign, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@repo/ui/button";
import { Field, Input, Textarea } from "@repo/ui/field";
import { Panel } from "@repo/ui/panel";
import { validateReward } from "@repo/stellar/escrow";
import { formatAmount } from "@repo/stellar/format";
import { isStellarAddress } from "@repo/stellar/address";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/escrow/store";
import { toast } from "@repo/ui/toast";
import { LIVE } from "@/lib/api/config";
import type { Bounty } from "@repo/stellar/bounty";

type Values = {
	title: string;
	project: string;
	deadline: string;
	requirements: string;
	description: string;
	acceptance: string;
	contributor: string;
	reward: string;
};

const EMPTY: Values = {
	title: "",
	project: "",
	deadline: "",
	requirements: "",
	description: "",
	acceptance: "",
	contributor: "",
	reward: "300",
};

const lines = (v: string) =>
	v
		.split("\n")
		.map((l) => l.replace(/^[-*•]\s*/, "").trim())
		.filter(Boolean);

function validate(v: Values, issuer?: string) {
	const e: Partial<Record<keyof Values, string>> = {};
	if (v.title.trim().length < 4) e.title = "Give the bounty a clear title (at least 4 characters).";
	// The API has no project field; the demo shows it next to the bounty id.
	if (!LIVE && v.project.trim().length < 2) e.project = "Add the project or team name.";
	if (!v.deadline) e.deadline = "Pick a completion deadline.";
	else if (new Date(`${v.deadline}T23:59:00Z`) < new Date()) e.deadline = "The deadline must be in the future.";
	else if (new Date(`${v.deadline}T23:59:00Z`).getTime() > Date.now() + 365 * 86_400_000)
		e.deadline = "Pick a deadline within the next 365 days.";
	if (lines(v.requirements).length === 0) e.requirements = "Add at least one completion requirement.";
	if (v.description.trim().length < 20) e.description = "Tell contributors what to build in at least 20 characters.";
	if (lines(v.acceptance).length === 0) e.acceptance = "Add at least one acceptance check.";
	for (const k of ["description", "requirements", "acceptance"] as const)
		if (v[k].length > 5000) e[k] = "Keep this under 5,000 characters.";
	const rewardError =
		validateReward(Number(v.reward)) ?? (/^\d+(\.\d{1,2})?$/.test(v.reward.trim()) ? null : "Use up to 2 decimals, like 300.00.");
	if (!v.reward || rewardError) e.reward = rewardError ?? "Enter a reward amount.";
	if (v.contributor && !isStellarAddress(v.contributor)) e.contributor = "Enter a valid Stellar address (G…, 56 characters).";
	else if (v.contributor && v.contributor.trim() === issuer) e.contributor = "You can't assign yourself.";
	return e;
}

/** API field (`error.fields[].field`) → form input. */
const API_FIELDS: Record<string, keyof Values> = {
	title: "title",
	description: "description",
	requirements: "requirements",
	acceptanceCriteria: "acceptance",
	rewardAmount: "reward",
	deadline: "deadline",
	contributorAddress: "contributor",
};

const fromBounty = (b: Bounty): Values => ({
	title: b.title,
	project: b.project,
	deadline: b.deadline.slice(0, 10),
	requirements: b.requirements.join("\n"),
	description: b.description,
	acceptance: b.acceptanceCriteria.join("\n"),
	contributor: b.contributor ?? "",
	reward: b.chain?.reward ?? String(b.rewardAmount),
});

/** Create a bounty, or edit an unpublished draft (`initial`). */
export function CreateBountyForm({ initial }: { initial?: Bounty }) {
	const router = useRouter();
	const createBounty = useAppStore((s) => s.createBounty);
	const updateDraft = useAppStore((s) => s.updateDraft);
	const setRole = useAppStore((s) => s.setRole);
	const role = useAppStore((s) => s.role);
	const issuer = useAppStore((s) => s.wallet?.address);
	const [values, setValues] = useState<Values>(() => (initial ? fromBounty(initial) : EMPTY));
	const [touched, setTouched] = useState(false);
	const [busy, setBusy] = useState(false);
	const [minDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));

	const errors = validate(values, issuer);
	// The API's own field messages (VALIDATION_FAILED / BOUNTY_INCOMPLETE / INVALID_CONTRIBUTOR), beside the inputs.
	const apiErrors = useAppStore((s) => s.fieldErrors);
	const clearApiErrors = useAppStore((s) => s.clearFieldErrors);
	const apiError = (k: keyof Values) => Object.entries(apiErrors).find(([f]) => API_FIELDS[f] === k)?.[1];
	const show = (k: keyof Values) => (touched ? errors[k] : undefined) ?? apiError(k);
	const reward = Number(values.reward) || 0;

	const bind = (k: keyof Values) => ({
		id: k,
		name: k,
		value: values[k],
		"aria-invalid": !!show(k),
		onChange: (e: { target: { value: string } }) => {
			if (apiError(k)) clearApiErrors();
			setValues((v) => ({ ...v, [k]: e.target.value }));
		},
	});

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setTouched(true);
		const errorCount = Object.keys(errors).length;
		if (errorCount) {
			toast.error("Check the highlighted fields", {
				description: `${errorCount} ${errorCount === 1 ? "field needs" : "fields need"} attention.`,
			});
			document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
			return;
		}
		if (role !== "issuer") setRole("issuer");
		setBusy(true);
		const input = {
			title: values.title.trim(),
			project: values.project.trim(),
			description: values.description.trim(),
			rewardAmount: reward,
			rewardText: values.reward.trim(),
			deadline: new Date(`${values.deadline}T23:59:00Z`).toISOString(),
			requirements: lines(values.requirements),
			acceptanceCriteria: lines(values.acceptance),
			contributor: values.contributor.trim() || undefined,
		};
		if (initial) {
			const ok = await updateDraft(initial.id, input);
			setBusy(false);
			if (ok) router.push(`/bounties/${initial.id}`);
			return;
		}
		const id = await createBounty(input);
		setBusy(false);
		if (id) router.push(`/bounties/${id}/fund`);
		else requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
	}

	return (
		<>
			<PageHeader
				eyebrow={initial ? `Draft ${initial.id}` : "Set a clear deal"}
				title={initial ? "Edit your draft" : "Create a bounty"}
				description={
					initial
						? "Drafts can change freely until you publish them. After that the terms are locked."
						: "Be specific about the work. Lock the reward before anyone starts."
				}
				back={initial ? { href: `/bounties/${initial.id}`, label: "Back to bounty" } : undefined}
			/>

			<form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
				<div className="space-y-6">
					<Panel className="p-5 sm:p-8">
						<SectionTitle n="01" title="The assignment" sub="Describe the outcome you need." />
						<div className="mt-8 space-y-6">
							<Field label="Bounty title" hint="A clear, action-oriented summary" htmlFor="title" error={show("title")}>
								<Input {...bind("title")} placeholder="e.g. Build a contributor onboarding flow" maxLength={120} />
							</Field>
							<div className={cn("grid gap-6", !LIVE && "sm:grid-cols-2 sm:gap-4")}>
								{!LIVE && (
									<Field label="Project or team" htmlFor="project" error={show("project")}>
										<Input {...bind("project")} placeholder="e.g. Stellar Commons" />
									</Field>
								)}
								<Field label="Completion deadline" htmlFor="deadline" error={show("deadline")}>
									<Input {...bind("deadline")} type="date" min={minDate} />
								</Field>
							</div>
							<Field label="Completion requirements" htmlFor="requirements" error={show("requirements")}>
								<Textarea
									{...bind("requirements")}
									rows={3}
									placeholder={
										"All requested deliverables must be submitted with accessible links.\nThe completed work must meet all specified project functionalities."
									}
								/>
							</Field>
							<Field
								label="Description"
								hint="Share context, intended audience, and constraints"
								htmlFor="description"
								error={show("description")}
							>
								<Textarea {...bind("description")} rows={3} placeholder="Tell contributors what to build and why it matters…" />
							</Field>
							<Field
								label="Acceptance criteria"
								hint="Use one line for each check"
								htmlFor="acceptance"
								error={show("acceptance")}
							>
								<Textarea
									{...bind("acceptance")}
									rows={3}
									placeholder={"Measurable outcome one\nSupporting documentation included\nVerified at mobile and desktop widths"}
								/>
							</Field>
						</div>
					</Panel>

					<Panel className="p-5 sm:p-8">
						<SectionTitle n="02" title="Who will do the work?" sub="Name the contributor now, or assign one after funding." />
						<Field
							label="Contributor wallet address"
							hint="Optional. If you add it now, they're assigned right after funding."
							htmlFor="contributor"
							error={show("contributor")}
							className="mt-8"
						>
							<Input
								{...bind("contributor")}
								placeholder="G… (optional)"
								className="font-mono text-[13px]"
								spellCheck={false}
								autoComplete="off"
							/>
						</Field>
					</Panel>
				</div>

				<div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
					<Panel className="p-6">
						<div className="flex items-start gap-3">
							<span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-deep text-primary">
								<CircleDollarSign className="size-4" />
							</span>
							<div>
								<p className="text-sm font-semibold text-ink">Set the reward</p>
								<p className="text-[10px] text-muted">Your payout, held in escrow.</p>
							</div>
						</div>
						<Field label="Reward amount · USDC" htmlFor="reward" error={show("reward")} className="mt-8">
							<div className="relative">
								<Input
									{...bind("reward")}
									type="number"
									inputMode="decimal"
									min="0"
									step="0.01"
									className="pr-24 text-lg font-medium"
								/>
								<span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 rounded-[4px] bg-elevated px-2 py-1 text-sm font-semibold text-ink">
									<CircleDollarSign className="size-4 text-primary" /> USDC
								</span>
							</div>
						</Field>
						<div className="mt-4 rounded-[var(--radius-sm)] border border-primary bg-deep/40 p-4">
							<p className="flex items-center gap-2 text-sm font-semibold text-ink">
								<Lock className="size-5 text-primary" /> Reward locked before work begins
							</p>
							<p className="mt-1 text-[10px] leading-relaxed text-muted">
								Your USDC is reserved in escrow; payment goes to your approved contributor.
							</p>
						</div>
						<dl className="mt-6 divide-y divide-line text-[10px]">
							<div className="flex justify-between pb-3">
								<dt className="text-muted">Bounty reward</dt>
								<dd className="font-semibold text-ink tabular-nums">${formatAmount(reward)}</dd>
							</div>
							<div className="flex justify-between pt-3">
								<dt className="font-semibold text-ink">Total escrowed</dt>
								<dd className="font-semibold text-ink tabular-nums">${formatAmount(reward)}</dd>
							</div>
						</dl>
					</Panel>

					<Panel className="p-6">
						<p className="flex items-center gap-2 text-sm font-semibold text-ink">
							<ShieldCheck className="size-4 text-primary" /> Safe by design
						</p>
						<ul className="mt-5 space-y-3 text-[10px] text-ink">
							{["Contributor sees verified funding", "Only you approve the final payout", "Refunds follow clear conditions"].map(
								(t) => (
									<li key={t} className="flex items-center gap-2.5">
										<Check className="size-3.5 text-primary" /> {t}
									</li>
								),
							)}
						</ul>
					</Panel>

					<div className="grid grid-cols-[auto_1fr] gap-4">
						<Button variant="secondary" size="lg" onClick={() => router.back()} className="px-8">
							Cancel
						</Button>
						<Button
							type="submit"
							size="lg"
							loading={busy}
							loadingText={LIVE || initial ? "Saving…" : "Creating…"}
							iconRight={<ArrowRight />}
						>
							{initial ? "Save changes" : "Create your bounty"}
						</Button>
					</div>
					<p className="text-center text-[10px] text-muted">
						{LIVE
							? "This saves a draft. Nothing is on Stellar until you publish and fund it on the next screen."
							: "Creating this preview bounty does not submit a real Stellar transaction."}
					</p>
				</div>
			</form>
		</>
	);
}

function SectionTitle({ n, title, sub }: { n: string; title: string; sub: string }) {
	return (
		<div className="flex items-start gap-3">
			<span
				className={cn(
					"grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-deep text-xs font-medium text-primary",
				)}
			>
				{n}
			</span>
			<div>
				<h2 className="text-sm font-semibold text-ink">{title}</h2>
				<p className="mt-0.5 text-[10px] text-muted">{sub}</p>
			</div>
		</div>
	);
}
