/** Brand copy and URLs for the app's metadata. */
const SITE_NAME = "Boluck";
const SITE_TITLE = "Boluck — Bounty escrow on Stellar";
const SITE_TAGLINE = "A clear deal. A funded promise.";
const SITE_DESCRIPTION =
	"Boluck lets teams post bounties, lock the reward in escrow on Stellar, and release it to the contributor the moment their work is approved. Built on Stellar Testnet with USDC.";
const SITE_KEYWORDS = [
	"Boluck",
	"bounty escrow",
	"Stellar",
	"Stellar escrow",
	"USDC bounties",
	"contributor payments",
	"web3 bounties",
	"Freighter wallet",
	"Stellar Testnet",
];

/** Mirrors `--color-canvas` in packages/ui globals.css (browser chrome on mobile). */
const THEME_COLOR = "#0d1b2a";

/** Read through next.config `env`, so client components agree with the server render. */
const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

/** This app's base path: `/app` on every Vercel deployment, empty in dev (next.config.ts). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Absolute site URL for `metadataBase`: NEXT_PUBLIC_SITE_URL → the deployment URL on Vercel → localhost in dev.
 * Includes the base path, so previews resolve metadata URLs under `/app`.
 */
const ORIGIN =
	process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ?? "http://localhost:3000";
const SITE_URL = new URL(`${BASE_PATH}/`, ORIGIN);

/** The landing site (`apps/landing`). Link to it with a plain <a>. */
const LANDING_URL =
	process.env.NEXT_PUBLIC_LANDING_URL ??
	(IS_PRODUCTION || process.env.NODE_ENV !== "development" ? "/" : "http://localhost:3002");

export { SITE_NAME, SITE_TITLE, SITE_TAGLINE, SITE_DESCRIPTION, SITE_KEYWORDS, THEME_COLOR, BASE_PATH, SITE_URL, LANDING_URL };
