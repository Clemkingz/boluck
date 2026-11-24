/** Brand copy and URLs for the admin console. */
export const SITE_NAME = "Boluck Admin";
export const SITE_DESCRIPTION = "Operations console for Boluck: bounties, escrow transactions, wallets and system health.";
/** Mirrors `--color-canvas` in packages/ui globals.css. */
export const THEME_COLOR = "#0d1b2a";
/** This app's base path: `/admin` on Vercel, empty in dev (next.config.ts). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** The product app, for "open in app" links. */
export const APP_URL =
	process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "/app");
