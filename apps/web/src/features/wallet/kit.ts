"use client";

/**
 * Real Stellar wallets through Stellar Wallets Kit v2 on Testnet (same approach as the Stackly reference).
 *
 * Varial (formerly Freighter, https://varialwallet.com) is the recommended wallet: its browser extension on desktop,
 * its mobile app over WalletConnect on phones (and by QR code on desktop). The kit touches `window` when it loads,
 * so it is imported lazily, in the browser only. Boluck asks a wallet for its address and for transaction signatures
 * (the sign-in challenge is a transaction); it never sees a secret key.
 *
 * Phones: a page can't tell whether an app is installed. Varial Mobile opens the Varial app straight away with the
 * WalletConnect pairing link; if the page is still in front a few seconds later, the app most likely isn't installed
 * and the connect panel offers the store link. Inside Varial's own in-app browser (`window.stellar.platform ===
 * "mobile"`) the kit treats WalletConnect as a "platform wrapper": the app is already there.
 */
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import type { WalletConnectModule } from "@creit.tech/stellar-wallets-kit/modules/wallet-connect";
import type { WalletId } from "@repo/stellar/bounty";
import { NETWORK_PASSPHRASE } from "@repo/stellar/network";
import { BASE_PATH } from "@/lib/site";
import { VARIAL_STORES, WALLETS } from "./wallets";

/** WalletConnect (Reown) project id. Public (it ships in the bundle); override per environment if needed. */
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "b8cc56756132b11f2077932ac3d6f807";

/** Varial's app scheme (still Freighter's) and its WalletConnect pairing route, as listed in the WalletConnect registry. */
const VARIAL_APP = "freighterwallet://";
const varialPairingLink = (uri: string) => `${VARIAL_APP}wc-redirect/wc?uri=${encodeURIComponent(uri)}`;

/** Our wallet ids → the kit's module ids. */
const KIT_ID: Record<WalletId, string> = {
	freighter: "varial",
	varial_mobile: "wallet_connect",
	xbull: "xbull",
	albedo: "albedo",
	lobstr: "lobstr",
	rabet: "rabet",
	hana: "hana",
};

/* ---------- platform ---------- */

export type Platform = "ios" | "android" | "desktop";

/** Phones and tablets (iPadOS reports itself as a Mac, so touch points decide). */
export function detectPlatform(): Platform {
	if (typeof navigator === "undefined") return "desktop";
	const ua = navigator.userAgent;
	if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
	if (/android/i.test(ua)) return "android";
	if (/mobile/i.test(ua)) return "android";
	return "desktop";
}

/** The app store for this phone, or Varial's site when the platform is unknown. */
export function varialAppStoreUrl(platform = detectPlatform()) {
	return platform === "ios" ? VARIAL_STORES.ios : platform === "android" ? VARIAL_STORES.android : VARIAL_STORES.site;
}

/* ---------- test hook ---------- */

/**
 * Browser end-to-end tests in development builds: Playwright exposes a signer that holds a throwaway Testnet key in
 * the test process. Never present in production builds.
 */
type TestWallet = {
	address: string;
	networkPassphrase: string;
	sign: (xdr: string, networkPassphrase: string) => Promise<string>;
};
const testWallet = (): TestWallet | undefined =>
	process.env.NODE_ENV !== "production" && typeof window !== "undefined"
		? (window as unknown as { __BOLUCK_TEST_WALLET__?: TestWallet }).__BOLUCK_TEST_WALLET__
		: undefined;

/* ---------- the kit ---------- */

type Kit = typeof StellarWalletsKit;
type Loaded = { kit: Kit; walletConnect: WalletConnectModule };

/**
 * One kit per page, surviving Fast Refresh: a second `init` would stand up a second WalletConnect client on the same
 * project id, whose pairing the phone approves while the page waits on the other one.
 */
const state: { kit: Promise<Loaded> | null } = ((
	globalThis as { __boluckWalletKit?: { kit: Promise<Loaded> | null } }
).__boluckWalletKit ??= { kit: null });

async function loadKit(): Promise<Loaded> {
	const [
		{ StellarWalletsKit, Networks },
		{ VarialModule },
		{ xBullModule },
		{ AlbedoModule },
		{ LobstrModule },
		{ RabetModule },
		{ HanaModule },
		{ WalletConnectModule, WalletConnectTargetChain },
	] = await Promise.all([
		import("@creit.tech/stellar-wallets-kit"),
		import("@creit.tech/stellar-wallets-kit/modules/varial"),
		import("@creit.tech/stellar-wallets-kit/modules/xbull"),
		import("@creit.tech/stellar-wallets-kit/modules/albedo"),
		import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
		import("@creit.tech/stellar-wallets-kit/modules/rabet"),
		import("@creit.tech/stellar-wallets-kit/modules/hana"),
		import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
	]);
	const origin = window.location.origin;
	const walletConnect = new WalletConnectModule({
		projectId: WALLETCONNECT_PROJECT_ID,
		metadata: {
			name: "Boluck",
			description: "Bounty escrow and contributor payments on Stellar",
			url: origin,
			icons: [`${origin}${BASE_PATH}/icon.png`],
		},
		allowedChains: [WalletConnectTargetChain.TESTNET],
	});
	StellarWalletsKit.init({
		modules: [
			new VarialModule(),
			walletConnect,
			new xBullModule(),
			new AlbedoModule(),
			new LobstrModule(),
			new RabetModule(),
			new HanaModule(),
		],
		network: Networks.TESTNET,
	});
	return { kit: StellarWalletsKit, walletConnect };
}

/** Loaded on first use and shared after; a failed load (dropped chunk) is forgotten so the next action retries. */
function getKit() {
	state.kit ??= loadKit().catch((error) => {
		state.kit = null;
		throw error;
	});
	return state.kit;
}

/** Selects the wallet; for Varial Mobile, waits briefly for the WalletConnect relay client (it starts asynchronously). */
async function selectWallet(id: WalletId): Promise<Loaded> {
	const loaded = await getKit();
	loaded.kit.setWallet(KIT_ID[id]);
	if (id === "varial_mobile") {
		for (let i = 0; i < 100 && !(await loaded.walletConnect.isAvailable()); i++) await new Promise((r) => setTimeout(r, 100));
	}
	return loaded;
}

/* ---------- errors ---------- */

/** Thrown when the person closes or declines the wallet prompt. */
export class WalletRejected extends Error {}
/** The extension didn't answer: it isn't installed, or it's disabled in this browser. */
export class WalletNotInstalled extends Error {}

/** Wallet modules reject with strings, objects or Errors; normalise to a message. */
function messageOf(e: unknown) {
	if (typeof e === "string") return e;
	if (e && typeof e === "object" && "message" in e && typeof e.message === "string") return e.message;
	return "The wallet returned an error.";
}
const looksRejected = (msg: string) => /reject|declin|denied|cancel|closed|user/i.test(msg);
const looksMissing = (msg: string) => /not connected|not installed|not available|not detected|is not running/i.test(msg);

function normalise(e: unknown): Error {
	if (e instanceof WalletRejected || e instanceof WalletNotInstalled) return e;
	const msg = messageOf(e);
	if (looksMissing(msg)) return new WalletNotInstalled(msg);
	return looksRejected(msg) ? new WalletRejected(msg) : new Error(msg);
}

/* ---------- availability ---------- */

/** Which wallets this browser can use right now. Varial Mobile needs nothing installed on this page. */
export async function walletAvailability(): Promise<Partial<Record<WalletId, boolean>>> {
	if (testWallet()) return Object.fromEntries(WALLETS.map((w) => [w.id, true]));
	let supported: { id: string; isAvailable: boolean }[] = [];
	try {
		supported = await (await getKit()).kit.refreshSupportedWallets();
	} catch {
		// The kit couldn't load (blocked script, old browser): everything shows as not detected.
	}
	return Object.fromEntries(
		WALLETS.map((w) => [
			w.id,
			w.id === "varial_mobile" ? supported.length > 0 : supported.some((s) => s.id === KIT_ID[w.id] && s.isAvailable),
		]),
	);
}

/** Inside the Varial app's own browser: only Varial Mobile makes sense, and it's already connected through the app. */
export function inVarialApp(): boolean {
	if (typeof window === "undefined") return false;
	const s = (window as unknown as { stellar?: { provider?: string; platform?: string } }).stellar;
	return (s?.provider === "varial" || s?.provider === "freighter") && s?.platform === "mobile";
}

/* ---------- phone hand-off ---------- */

/** Called when Varial didn't open on this phone (most likely not installed); `retry` opens it again. */
let onAppNotOpened: ((retry: () => void) => void) | null = null;
export const setAppNotOpenedHandler = (fn: ((retry: () => void) => void) | null) => {
	onAppNotOpened = fn;
};

/** Opens a Varial link and reports if the page wasn't sent to the background within a few seconds. */
function openVarial(link: string, onNotOpened?: () => void) {
	let left = false;
	const onHide = () => {
		if (document.visibilityState === "hidden") left = true;
	};
	document.addEventListener("visibilitychange", onHide);
	window.addEventListener("pagehide", onHide);
	window.location.href = link;
	window.setTimeout(() => {
		document.removeEventListener("visibilitychange", onHide);
		window.removeEventListener("pagehide", onHide);
		if (!left && document.visibilityState === "visible") onNotOpened?.();
	}, 2500);
}

/** WalletConnect needs WebCrypto, which browsers only expose over HTTPS or localhost (not http://192.168.…). */
function assertSecureContext() {
	if (!window.isSecureContext)
		throw new Error("Mobile wallets need a secure connection. Open Boluck over HTTPS to connect Varial Mobile.");
}

/**
 * Desktop: the kit opens Reown AppKit's QR modal and waits for the pairing forever, even after the modal closes.
 * Closing it (after it has opened) counts as cancelling.
 */
function untilClosed<T>(walletConnect: WalletConnectModule, pending: Promise<T>): Promise<T> {
	let unsubscribe = () => {};
	const closed = new Promise<never>((_, reject) => {
		let opened = false;
		unsubscribe = walletConnect.modal.subscribeState(({ open }) => {
			if (open) opened = true;
			else if (opened) reject(new WalletRejected("Connection cancelled in WalletConnect."));
		});
	});
	return Promise.race([pending, closed]).finally(unsubscribe);
}

/**
 * Phones: instead of AppKit's wallet list, open Varial straight away with the pairing link the kit would show, so it's
 * one tap. The kit hands the link to `modal.open({ uri })`; it's borrowed for this one connection, then restored.
 */
function withDirectHandoff<T>(walletConnect: WalletConnectModule, start: () => Promise<T>): Promise<T> {
	const modal = walletConnect.modal;
	const original = modal.open;
	let link: string | null = null;
	modal.open = (async (options?: { uri?: string }) => {
		if (!options?.uri) return original.call(modal, options as Parameters<typeof original>[0]);
		if (link) return; // the kit and the sign client can both announce the same pairing
		link = varialPairingLink(options.uri);
		const retry = () => link && openVarial(link);
		openVarial(link, () => onAppNotOpened?.(retry));
	}) as typeof original;
	return start().finally(() => {
		modal.open = original;
	});
}

async function usingWalletConnect() {
	const { kit, walletConnect } = await getKit();
	return kit.selectedModule?.productId === walletConnect.productId;
}

/** On a phone over WalletConnect, a request waits in the Varial app the person just left: bring it forward. */
export async function openWalletApp() {
	if (detectPlatform() === "desktop" || !(await usingWalletConnect())) return;
	if (await (await getKit()).walletConnect.isPlatformWrapper()) return; // already inside the app
	openVarial(VARIAL_APP);
}

/** Whether signing happens in the Varial app on this phone (the dialog then shows an "Open Varial" button). */
export function needsWalletApp(id?: WalletId) {
	return id === "varial_mobile" && detectPlatform() !== "desktop" && !inVarialApp() && !testWallet();
}

/* ---------- actions ---------- */

/** Asks the wallet for its address (opens the wallet's connect prompt, the QR code, or the Varial app). */
export async function getWalletAddress(id: WalletId): Promise<string> {
	const t = testWallet();
	if (t) return t.address;
	try {
		if (id === "varial_mobile") assertSecureContext();
		const { kit, walletConnect } = await selectWallet(id);
		if (id !== "varial_mobile") return (await kit.fetchAddress()).address;
		const onPhone = detectPlatform() !== "desktop" && !(await walletConnect.isPlatformWrapper());
		const { address } = onPhone
			? await withDirectHandoff(walletConnect, () => kit.fetchAddress())
			: await untilClosed(walletConnect, kit.fetchAddress());
		return address;
	} catch (e) {
		throw normalise(e);
	}
}

/** The account the wallet has selected now, without prompting (to notice an account switch). */
export async function getCurrentAddress(id: WalletId): Promise<string | undefined> {
	const t = testWallet();
	if (t) return t.address;
	try {
		const { kit } = await selectWallet(id);
		return (await kit.getAddress()).address;
	} catch {
		return undefined;
	}
}

/** The network the wallet is set to, when it reports one (WalletConnect sessions are pinned to Testnet instead). */
export async function getWalletPassphrase(id: WalletId): Promise<string | undefined> {
	const t = testWallet();
	if (t) return t.networkPassphrase;
	if (id === "varial_mobile") return undefined;
	try {
		const { kit } = await selectWallet(id);
		return (await kit.getNetwork()).networkPassphrase || undefined;
	} catch {
		return undefined;
	}
}

/** Signs (never submits) a transaction the API prepared. On a phone, brings Varial forward to approve it. */
export async function signWithWallet(id: WalletId, xdr: string, networkPassphrase: string, address: string): Promise<string> {
	const t = testWallet();
	if (t) return t.sign(xdr, networkPassphrase);
	try {
		const { kit } = await selectWallet(id);
		const pending = kit.signTransaction(xdr, { networkPassphrase: networkPassphrase || NETWORK_PASSPHRASE, address });
		if (id === "varial_mobile") window.setTimeout(() => void openWalletApp(), 400); // after the request is on the relay
		const { signedTxXdr } = await pending;
		if (!signedTxXdr) throw new WalletRejected("The wallet didn't return a signature.");
		return signedTxXdr;
	} catch (e) {
		throw normalise(e);
	}
}

/** Ends the wallet's own connection where it has one (the WalletConnect session); others just forget the account. */
export async function disconnectWallet() {
	if (!state.kit || testWallet()) return;
	try {
		await (await state.kit).kit.disconnect();
	} catch {
		// Nothing to end.
	}
}
