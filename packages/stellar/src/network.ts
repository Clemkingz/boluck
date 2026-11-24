import type { Transaction } from "./bounty";

/** Boluck runs on Stellar Testnet only during the MVP. */
export const NETWORK = "TESTNET" as const;
export const NETWORK_LABEL = "Stellar Testnet";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const explorerAccountUrl = (address: string) => `${EXPLORER_BASE}/account/${address}`;

/** Demo-mode reference shown in place of an explorer link (simulated transactions have no real hash). */
export function txReference(tx: Pick<Transaction, "type" | "bountyId" | "hash">) {
	return `DEMO-${tx.type.toUpperCase()}-${tx.bountyId}-${tx.hash.slice(0, 7).toUpperCase()}`;
}
