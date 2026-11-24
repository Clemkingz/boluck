"use client";

import { AlertTriangle } from "lucide-react";
import { ButtonLink } from "@repo/ui/button";
import { Notice } from "@repo/ui/misc";
import { BountyNotFound, useBountyRoute, type BountyParams } from "./BountyRoute";
import { CreateBountyForm } from "./CreateBounty";

/** Edit an unpublished draft. Once a bounty is on Stellar its terms are locked (`BOUNTY_LOCKED`). */
export function EditDraft({ params }: { params: BountyParams }) {
	const { id, bounty, isIssuer } = useBountyRoute(params);
	if (!bounty) return <BountyNotFound id={id} />;
	const editable = isIssuer && bounty.status === "draft" && !bounty.chain?.onChain;
	if (!editable)
		return (
			<div className="mx-auto max-w-xl space-y-4">
				<Notice tone="attention" icon={<AlertTriangle />} title="This bounty can't be edited">
					{isIssuer ? "Its terms were locked when it was published on Stellar." : "Only the issuer can edit a draft."}
				</Notice>
				<ButtonLink href={`/bounties/${bounty.id}`} variant="secondary">
					Back to bounty
				</ButtonLink>
			</div>
		);
	return <CreateBountyForm key={bounty.id} initial={bounty} />;
}
