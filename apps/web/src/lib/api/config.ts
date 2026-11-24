/**
 * Where the app's data comes from.
 *
 * Live (default): the Boluck API on Railway, real Stellar wallets, Stellar Testnet.
 * Demo: `NEXT_PUBLIC_DEMO_MODE=1` runs the whole lifecycle in the browser on the seed data in mock-data.ts.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const LIVE = !DEMO_MODE;

/**
 * Includes `/api/v1`, no trailing slash (docs/FRONTEND_INTEGRATION.md §2). Set in next.config.ts: this app's own
 * `/api/v1` path (proxied to the backend, so no CORS), unless NEXT_PUBLIC_API_URL points straight at the backend.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api/v1").replace(/\/$/, "");

/** The backend itself, for display (Settings). */
export const API_ORIGIN_LABEL = "boluck-backend-production.up.railway.app";
