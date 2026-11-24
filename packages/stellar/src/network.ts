import type { Transaction } from "./bounty";

/** Boluck runs on Stellar Testnet only during the MVP. */
export const NETWORK = "TESTNET" as const;
export const NETWORK_LABEL = "Stellar Testnet";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

/** Placeholder until the escrow contract is deployed. */
export const ESCROW_CONTRACT_ID = "CBOLUCKESCROWDEMOCONTRACTNOTDEPLOYEDYETONSTELLARTESTNET";

/** While true, transaction references are labelled as demo references (no explorer links). */
export const DEMO_MODE = true;

export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const explorerAccountUrl = (address: string) => `${EXPLORER_BASE}/account/${address}`;

/** Demo reference shown instead of an explorer link while no contract is deployed. */
export function txReference(tx: Pick<Transaction, "type" | "bountyId" | "hash">) {
	return `DEMO-${tx.type.toUpperCase()}-${tx.bountyId}-${tx.hash.slice(0, 7).toUpperCase()}`;
}
