import type { WalletId } from "@repo/stellar/bounty";

export interface WalletOption {
	id: WalletId;
	name: string;
	kind: string;
	/** Demo only: ready = installed extension, install = not installed. Live mode detects for real. */
	state: "ready" | "install";
	recommended?: boolean;
	installUrl: string;
	/** Where the wallet works: browser extensions only exist on desktop; Varial Mobile is offered everywhere. */
	platforms: ("desktop" | "phone")[];
}

/** Varial's store listings (they still carry Freighter's name). https://varialwallet.com */
export const VARIAL_STORES = {
	extension: "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk",
	ios: "https://apps.apple.com/us/app/freighter/id6743947720",
	android: "https://play.google.com/store/apps/details?id=org.stellar.freighterwallet",
	site: "https://varialwallet.com/",
};

/** Wallets offered in the connect panel (design "Connect your wallet"). */
export const WALLETS: WalletOption[] = [
	{
		id: "freighter",
		name: "Varial",
		kind: "Browser extension · formerly Freighter",
		state: "install",
		recommended: true,
		installUrl: VARIAL_STORES.extension,
		platforms: ["desktop"],
	},
	{
		id: "varial_mobile",
		name: "Varial Mobile",
		kind: "Varial app · WalletConnect",
		state: "ready",
		recommended: true,
		installUrl: VARIAL_STORES.site,
		platforms: ["desktop", "phone"],
	},
	{
		id: "xbull",
		name: "xBull",
		kind: "Extension & mobile",
		state: "ready",
		installUrl: "https://xbull.app/",
		platforms: ["desktop"],
	},
	{
		id: "albedo",
		name: "Albedo",
		kind: "Web",
		state: "ready",
		installUrl: "https://albedo.link/",
		platforms: ["desktop", "phone"],
	},
	{ id: "lobstr", name: "LOBSTR", kind: "Extension", state: "install", installUrl: "https://lobstr.co/", platforms: ["desktop"] },
	{ id: "rabet", name: "Rabet", kind: "Extension", state: "install", installUrl: "https://rabet.io/", platforms: ["desktop"] },
	{
		id: "hana",
		name: "Hana",
		kind: "Extension",
		state: "install",
		installUrl: "https://www.hanawallet.io/",
		platforms: ["desktop"],
	},
];

export const walletName = (id?: WalletId) => WALLETS.find((w) => w.id === id)?.name ?? "Wallet";
