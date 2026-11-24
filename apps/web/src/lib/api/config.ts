/**
 * Where the app's data comes from.
 *
 * Live (default): the Boluck API on Railway, real Stellar wallets, Stellar Testnet.
 * Demo: `NEXT_PUBLIC_DEMO_MODE=1` runs the whole lifecycle in the browser on the seed data in mock-data.ts.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const LIVE = !DEMO_MODE;

/** Includes `/api/v1`, no trailing slash (docs/FRONTEND_INTEGRATION.md §2). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://boluck-backend-production.up.railway.app/api/v1").replace(
	/\/$/,
	"",
);
