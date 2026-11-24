/** Brand copy for metadata. */
const SITE_NAME = "Boluck";
const SITE_TITLE = "Boluck — Bounty escrow on Stellar";
const SITE_TAGLINE = "A clear deal. A funded promise.";
const SITE_DESCRIPTION =
	"Boluck lets teams post bounties, lock the reward in an escrow smart contract, and release it to the contributor the moment their work is approved. Built on Stellar Testnet with USDC.";
const SITE_KEYWORDS = [
	"Boluck",
	"bounty escrow",
	"Stellar",
	"smart contract escrow",
	"USDC bounties",
	"contributor payments",
	"web3 bounties",
	"Freighter wallet",
	"Stellar Testnet",
];

/** Mirrors `--color-canvas` in packages/ui globals.css. */
const THEME_COLOR = "#0d1b2a";

/**
 * Absolute URL of this site, for `metadataBase` / canonical / robots / sitemap: NEXT_PUBLIC_SITE_URL → the
 * deployment URL on Vercel → localhost in dev.
 */
const SITE_URL = new URL(
	process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ?? "http://localhost:3002",
);

/**
 * The app (`apps/web`): `/app` on the shared Vercel host, its own port in dev. Links into it are plain <a>s: a
 * <Link> would route inside this landing app.
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "/app");

const APP_LINKS = {
	overview: `${APP_URL}/overview`,
	explore: `${APP_URL}/bounties`,
	/** Wallet hand-off: the app's connect page resumes the chosen wallet + role. */
	connect: (params: Record<string, string>) => `${APP_URL}/connect?${new URLSearchParams(params)}`,
};

export { SITE_NAME, SITE_TITLE, SITE_TAGLINE, SITE_DESCRIPTION, SITE_KEYWORDS, THEME_COLOR, SITE_URL, APP_URL, APP_LINKS };
