"use client";

/**
 * Admin session. Admins sign in with their Stellar wallet exactly like everyone else (challenge → sign → verify,
 * docs/FRONTEND_INTEGRATION.md §4); the backend then decides on `GET /admin/me` whether this wallet is on the admin
 * allow-list. The UI only mirrors that answer: every admin route is enforced by the backend.
 *
 * The token is kept in sessionStorage (guide §4), so closing the tab signs the admin out.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { WalletId } from "@repo/stellar/bounty";
import { NETWORK_PASSPHRASE } from "@repo/stellar/network";
import { toast } from "@repo/ui/toast";
import { ApiError, auth, setToken, setUnauthorizedHandler } from "@/lib/api/client";
import { admin, type AdminMe } from "@/lib/api/admin";
import {
	disconnectWallet,
	getWalletAddress,
	getWalletPassphrase,
	signWithWallet,
	WalletNotInstalled,
	WalletRejected,
} from "@/features/wallet/kit";
import { walletName } from "@/features/wallet/wallets";

export type AccessState = "unknown" | "checking" | "admin" | "denied";

interface AuthState {
	hydrated: boolean;
	wallet: { address: string; provider: WalletId } | null;
	token: string | null;
	expiresAt: string | null;
	access: AccessState;
	me: AdminMe | null;
	/** Why the last sign-in failed, and at which step. */
	error: { step: string; message: string } | null;
	signIn: (provider: WalletId) => Promise<boolean | "missing">;
	signOut: (reason?: string) => void;
	checkAccess: () => Promise<void>;
}

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");

export const useAuth = create<AuthState>()(
	persist(
		(set, get) => {
			const clear = () => {
				setToken(null);
				set({ wallet: null, token: null, expiresAt: null, access: "unknown", me: null });
			};
			setUnauthorizedHandler(() => {
				if (!get().token) return;
				clear();
				toast.warning("Your admin session ended", { description: "Sign in with your wallet again." });
			});

			return {
				hydrated: false,
				wallet: null,
				token: null,
				expiresAt: null,
				access: "unknown",
				me: null,
				error: null,

				signIn: async (provider) => {
					let step = `Connecting to ${walletName(provider)}`;
					set({ error: null });
					try {
						const address = await getWalletAddress(provider);
						step = "Checking the network";
						const passphrase = await getWalletPassphrase(provider);
						if (passphrase && passphrase !== NETWORK_PASSPHRASE)
							throw new Error("Your wallet is on a different Stellar network. Switch it to Testnet and try again.");
						step = "Getting the sign-in request";
						const challenge = await auth.challenge(address);
						step = `Signing in with ${walletName(provider)}`;
						const signed = await signWithWallet(provider, challenge.transaction, challenge.networkPassphrase, address);
						step = "Verifying the signature";
						const session = await auth.verify(signed);
						setToken(session.walletToken);
						set({
							wallet: { address: session.address, provider },
							token: session.walletToken,
							expiresAt: session.expiresAt,
							access: "checking",
						});
						step = "Checking admin access";
						await get().checkAccess();
						return get().access === "admin";
					} catch (e) {
						if (e instanceof WalletNotInstalled) return "missing";
						if (e instanceof WalletRejected) {
							toast.warning("Sign-in cancelled", { description: `Nothing was signed in ${walletName(provider)}.` });
							return false;
						}
						set({ error: { step, message: message(e) } });
						return false;
					}
				},

				checkAccess: async () => {
					if (!get().token) return;
					set({ access: "checking" });
					try {
						const me = await admin.me();
						set({ access: "admin", me });
					} catch (e) {
						if (e instanceof ApiError && (e.status === 403 || e.code === "NOT_ADMIN")) {
							// Not an admin: end the session so the token can't be reused here.
							const address = get().wallet?.address;
							void auth.logout().catch(() => {});
							clear();
							set({ access: "denied", wallet: address ? { address, provider: "freighter" } : null });
							return;
						}
						if (e instanceof ApiError && e.status === 401) return; // handled by the unauthorized handler
						set({ access: "unknown", error: { step: "Checking admin access", message: message(e) } });
					}
				},

				signOut: (reason) => {
					void auth.logout().catch(() => {});
					void disconnectWallet();
					clear();
					set({ error: null });
					toast.info("Signed out", { description: reason ?? "Sign in again with an admin wallet to continue." });
				},
			};
		},
		{
			name: "boluck-admin",
			version: 1,
			storage: createJSONStorage(() => sessionStorage),
			skipHydration: true,
			partialize: (s) => ({ wallet: s.wallet, token: s.token, expiresAt: s.expiresAt }) as unknown as AuthState,
			onRehydrateStorage: () => () => {
				const s = useAuth.getState();
				if (s.token && s.expiresAt && new Date(s.expiresAt).getTime() > Date.now()) {
					setToken(s.token);
					useAuth.setState({ hydrated: true });
					void s.checkAccess();
				} else {
					useAuth.setState({ hydrated: true, wallet: null, token: null, expiresAt: null });
				}
			},
		},
	),
);
