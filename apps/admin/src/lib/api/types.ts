/** Shared envelope and wallet sign-in shapes (docs/FRONTEND_INTEGRATION.md §3–4). Admin shapes live in admin.ts. */

export interface Envelope<T> {
	statusCode: number;
	message: string;
	data: T;
}

export interface ErrorBody {
	statusCode: number;
	message: string;
	data: null;
	error?: { code: string; requestId?: string; retryAfterSeconds?: number };
}

export interface Page<T> {
	result: T[];
	paginationMeta: {
		nextPage: boolean;
		previousPage: boolean;
		currentPage: number;
		totalPage: number;
		totalCount: number;
		pageCount: number;
	};
}

export interface ChallengeDto {
	transaction: string;
	networkPassphrase: string;
	homeDomain: string;
	expiresAt: string;
}

export interface WalletSessionDto {
	address: string;
	shortAddress: string;
	networkPassphrase: string;
	expiresAt: string;
}

export interface WalletTokenDto extends WalletSessionDto {
	walletToken: string;
	tokenType: "Bearer";
	expiresIn: number;
}
