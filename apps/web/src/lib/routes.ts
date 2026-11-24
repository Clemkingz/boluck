/** Every app route. Screen 1 (landing) lives in apps/landing. */
export const routes = {
	CONNECT: "/connect",
	OVERVIEW: "/overview",
	BOUNTIES: "/bounties",
	CREATE: "/bounties/new",
	BOUNTY: (id: string) => `/bounties/${id}`,
	FUND: (id: string) => `/bounties/${id}/fund`,
	SUBMIT: (id: string) => `/bounties/${id}/submit`,
	REVIEW: (id: string) => `/bounties/${id}/review`,
	HISTORY: "/history",
	REFUNDS: "/refunds",
	REFUND_FOR: (id: string) => `/refunds?bounty=${id}`,
	SETTINGS: "/settings",
} as const;
