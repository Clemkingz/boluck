"use client";

import { AlertTriangle, MessageSquareWarning, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BountyMiniHeader, BountyNotFound, useBountyRoute, type BountyParams } from "@/features/bounties/components/BountyRoute";
import { ReviewAside } from "@/features/bounties/components/ReviewAside";
import { PageHeader } from "@/components/PageHeader";
import { Button, ButtonLink } from "@repo/ui/button";
import { Field, Input, Textarea } from "@repo/ui/field";
import { Notice } from "@repo/ui/misc";
import { Panel } from "@repo/ui/panel";
import { canSubmit } from "@repo/stellar/escrow";
import { LIVE } from "@/lib/api/config";
import { useAppStore } from "@/features/escrow/store";

const isUrl = (v: string) => {
	try {
		const u = new URL(v);
		return u.protocol === "https:" || u.protocol === "http:";
	} catch {
		return false;
	}
};

export function SubmitWork({ params }: { params: BountyParams }) {
	const router = useRouter();
	const { id, bounty, address } = useBountyRoute(params);
	const submit = useAppStore((s) => s.submitWork);
	const [values, setValues] = useState({ deliverableUrl: "", notes: "", evidence: "" });
	const [touched, setTouched] = useState(false);
	const [busy, setBusy] = useState(false);
	const apiErrors = useAppStore((s) => s.fieldErrors);
	const clearApiErrors = useAppStore((s) => s.clearFieldErrors);
	if (!bounty) return <BountyNotFound id={id} />;

	const guard =
		canSubmit(bounty, address) ??
		(bounty.chain && !bounty.chain.availableActions.includes("submit")
			? "The submission window has closed for this bounty."
			: null);
	const feedback = bounty.submissions.at(-1)?.review;
	const errors = {
		deliverableUrl: !values.deliverableUrl
			? "Add a link to your deliverable."
			: !isUrl(values.deliverableUrl)
				? "Enter a full URL, starting with https://"
				: undefined,
		notes:
			values.notes.trim().length < 10
				? "Summarize what you delivered (at least 10 characters)."
				: values.notes.length > 2000
					? "Keep the notes under 2,000 characters."
					: undefined,
		// A link or any reference (ticket, commit, file name), up to 500 characters (guide §7).
		evidence: values.evidence.length > 500 ? "Keep the evidence reference under 500 characters." : undefined,
	};
	// API field names for the submission (`submission.deliverableUrl` …) → this form's inputs.
	const apiError = {
		deliverableUrl: apiErrors["submission.deliverableUrl"],
		notes: apiErrors["submission.notes"],
		evidence: apiErrors["submission.evidenceReference"],
	};
	const shown = (k: keyof typeof values) => (touched ? errors[k] : undefined) ?? apiError[k];
	const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
		if (apiError[k]) clearApiErrors();
		setValues((v) => ({ ...v, [k]: e.target.value }));
	};

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setTouched(true);
		if (errors.deliverableUrl || errors.notes || errors.evidence || !bounty) return;
		setBusy(true);
		const ok = await submit(bounty.id, {
			deliverableUrl: values.deliverableUrl.trim(),
			notes: values.notes.trim(),
			evidence: values.evidence.trim(),
		});
		setBusy(false);
		if (ok) router.push(`/bounties/${bounty.id}`);
	}

	return (
		<>
			<PageHeader
				back={{ href: `/bounties/${bounty.id}`, label: "Back to bounty" }}
				eyebrow="Show what you built"
				title="Share your finished work."
				description="Share a link the issuer can review. Your work stays connected to its funded bounty."
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_346px] [&>*]:min-w-0">
				<Panel className="p-5 sm:p-8">
					<BountyMiniHeader bounty={bounty} />
					{guard ? (
						<div className="mt-8 space-y-4">
							<Notice tone="attention" icon={<AlertTriangle />}>
								{guard}
							</Notice>
							<ButtonLink href={`/bounties/${bounty.id}`} variant="secondary">
								Back to bounty
							</ButtonLink>
						</div>
					) : (
						<form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
							{feedback?.decision === "revision_requested" && (
								<Notice tone="review" icon={<MessageSquareWarning />} title="Issuer feedback">
									{feedback.comment || "Changes were requested."}
								</Notice>
							)}
							<Field
								label="Deliverable link"
								hint="Link to a PR, preview, file, or finished work"
								htmlFor="deliverableUrl"
								error={shown("deliverableUrl")}
							>
								<Input
									id="deliverableUrl"
									type="url"
									inputMode="url"
									value={values.deliverableUrl}
									onChange={set("deliverableUrl")}
									placeholder="https://github.com/your-project/pull/123"
									aria-invalid={!!shown("deliverableUrl")}
								/>
							</Field>
							<Field
								label="Submission notes"
								hint="What changed, and what should the issuer check?"
								htmlFor="notes"
								error={shown("notes")}
							>
								<Textarea
									id="notes"
									rows={4}
									value={values.notes}
									onChange={set("notes")}
									placeholder="Summarize the outcome, link the key changes, and highlight anything reviewers should know…"
									aria-invalid={!!shown("notes")}
								/>
							</Field>
							<Field
								label="Supporting evidence reference"
								hint="Optional: a link or reference to screenshots, test results, or other evidence"
								htmlFor="evidence"
								error={shown("evidence")}
							>
								<Input
									id="evidence"
									inputMode="url"
									value={values.evidence}
									onChange={set("evidence")}
									placeholder="https://…"
									aria-invalid={!!shown("evidence")}
								/>
							</Field>
							<Button type="submit" fullWidth size="lg" icon={<Send />} loading={busy} loadingText="Waiting for your wallet…">
								Submit to issuer
							</Button>
							<p className="text-[10px] text-muted">
								{LIVE
									? "Your wallet signs one transaction that records the submission on Stellar."
									: "Submitting your work changes this prototype's bounty status only."}
							</p>
						</form>
					)}
				</Panel>
				<ReviewAside bounty={bounty} />
			</div>
		</>
	);
}
