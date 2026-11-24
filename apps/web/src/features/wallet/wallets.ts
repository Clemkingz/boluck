import type { WalletId } from "@repo/stellar/bounty";

export interface WalletOption {
	id: WalletId;
	name: string;
	kind: string;
	/** In the simulation: ready = installed extension, install = not installed. */
	state: "ready" | "install";
	recommended?: boolean;
	installUrl: string;
}

/** Wallets offered in the connect panel (design "Connect your wallet"). */
export const WALLETS: WalletOption[] = [
	{
		id: "freighter",
		name: "Freighter",
		kind: "Extension",
		state: "install",
		recommended: true,
		installUrl: "https://www.freighter.app/",
	},
	{ id: "xbull", name: "xBull", kind: "Extension & mobile", state: "ready", installUrl: "https://xbull.app/" },
	{ id: "albedo", name: "Albedo", kind: "Web", state: "ready", installUrl: "https://albedo.link/" },
	{ id: "lobstr", name: "LOBSTR", kind: "Extension & mobile", state: "install", installUrl: "https://lobstr.co/" },
	{ id: "rabet", name: "Rabet", kind: "Extension", state: "install", installUrl: "https://rabet.io/" },
	{ id: "hana", name: "Hana", kind: "Extension", state: "install", installUrl: "https://www.hanawallet.io/" },
];

export const walletName = (id?: WalletId) => WALLETS.find((w) => w.id === id)?.name ?? "Wallet";
