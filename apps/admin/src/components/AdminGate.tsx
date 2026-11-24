"use client";

import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@repo/ui/misc";
import { SignIn } from "@/features/auth/components/SignIn";
import { useAuth } from "@/features/auth/store";

/** Restores the session, then shows the console only to a wallet the API confirms as admin. */
export function AdminGate({ children }: { children: ReactNode }) {
	const hydrated = useAuth((s) => s.hydrated);
	const token = useAuth((s) => s.token);
	const access = useAuth((s) => s.access);

	useEffect(() => {
		if (!useAuth.getState().hydrated) void useAuth.persist.rehydrate();
	}, []);

	if (!hydrated || (token && (access === "checking" || access === "unknown") && !useAuth.getState().error))
		return (
			<div className="space-y-4 p-6" aria-busy aria-label="Checking admin access">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-28" />
				<Skeleton className="h-64" />
			</div>
		);
	if (!token || access !== "admin") return <SignIn />;
	return <>{children}</>;
}
