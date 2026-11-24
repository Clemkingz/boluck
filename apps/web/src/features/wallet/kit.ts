"use client";

/**
 * Real Stellar wallets, through the Stellar Wallets Kit's per-wallet modules (loaded on first use so they stay out
 * of the initial bundle). Boluck only ever asks a wallet for its public address and for signatures; it never sees
 * a secret key.
 */
import type { WalletId } from "@repo/stellar/bounty";

interface WalletModule {
	isAvailable(): Promise<boolean>;
	getAddress(params: { skipRequestAccess?: boolean; path?: string }): Promise<{ address: string }>;
	signTransaction(
		xdr: string,
		opts?: { networkPassphrase?: string; address?: string },
	): Promise<{ signedTxXdr: string; signerAddress?: string }>;
	getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
}

/**
 * Test hook for browser end-to-end tests in development builds: Playwright exposes a signer that holds a throwaway
 * Testnet key in the test process. Never present in production builds.
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

const loaders: Record<WalletId, () => Promise<WalletModule>> = {
	freighter: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/varial")).VarialModule(),
	xbull: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/xbull")).xBullModule(),
	albedo: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/albedo")).AlbedoModule(),
	lobstr: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/lobstr")).LobstrModule(),
	rabet: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/rabet")).RabetModule(),
	hana: async () => new (await import("@creit.tech/stellar-wallets-kit/modules/hana")).HanaModule(),
};

const cache = new Map<WalletId, Promise<WalletModule>>();
const load = (id: WalletId) => {
	if (!cache.has(id))
		cache.set(
			id,
			loaders[id]().catch((e) => (cache.delete(id), Promise.reject(e))),
		);
	return cache.get(id)!;
};

/** Thrown when the person closes or declines the wallet prompt. */
export class WalletRejected extends Error {}

/** Wallet modules reject with strings, objects or Errors; normalise to a message. */
function messageOf(e: unknown) {
	if (typeof e === "string") return e;
	if (e && typeof e === "object" && "message" in e && typeof e.message === "string") return e.message;
	return "The wallet returned an error.";
}
const looksRejected = (msg: string) => /reject|declin|denied|cancel|closed|user/i.test(msg);

export async function isWalletAvailable(id: WalletId): Promise<boolean> {
	if (testWallet()) return true;
	try {
		return await (await load(id)).isAvailable();
	} catch {
		return false;
	}
}

/** Asks the wallet for its address (opens the wallet's connect prompt the first time). */
export async function getWalletAddress(id: WalletId): Promise<string> {
	const t = testWallet();
	if (t) return t.address;
	try {
		return (await (await load(id)).getAddress({})).address;
	} catch (e) {
		const msg = messageOf(e);
		throw looksRejected(msg) ? new WalletRejected(msg) : new Error(msg);
	}
}

/** The network the wallet is set to, when the wallet reports it (Albedo, for one, doesn't). */
export async function getWalletPassphrase(id: WalletId): Promise<string | undefined> {
	const t = testWallet();
	if (t) return t.networkPassphrase;
	try {
		return (await (await load(id)).getNetwork()).networkPassphrase || undefined;
	} catch {
		return undefined;
	}
}

/** Signs (does not submit) a transaction the API prepared. */
export async function signWithWallet(id: WalletId, xdr: string, networkPassphrase: string, address: string): Promise<string> {
	const t = testWallet();
	if (t) return t.sign(xdr, networkPassphrase);
	try {
		const { signedTxXdr } = await (await load(id)).signTransaction(xdr, { networkPassphrase, address });
		if (!signedTxXdr) throw new WalletRejected("The wallet didn't return a signature.");
		return signedTxXdr;
	} catch (e) {
		if (e instanceof WalletRejected) throw e;
		const msg = messageOf(e);
		throw looksRejected(msg) ? new WalletRejected(msg) : new Error(msg);
	}
}
