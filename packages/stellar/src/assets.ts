/** Reward tokens Boluck supports. MVP: testnet USDC only. */
export interface RewardAsset {
	code: "USDC";
	/** Classic asset issuer on Stellar Testnet. */
	issuer: string;
	decimals: number;
	label: string;
}

export const USDC: RewardAsset = {
	code: "USDC",
	// Circle's Stellar Testnet USDC issuer.
	issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
	decimals: 7,
	label: "Testnet USDC",
};

export const REWARD_ASSETS = [USDC] as const;
