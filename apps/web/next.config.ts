import type { NextConfig } from "next";

/**
 * On Vercel every deployment is one host shared by the services in the repo root `vercel.json`: landing at `/`,
 * this app under `/app`. Dev serves it at the root of localhost:3000. Once the app gets its own domain, set
 * APP_BASE_PATH="" to serve it at the root again. Anything that builds a URL by hand reads NEXT_PUBLIC_BASE_PATH.
 */
const BASE_PATH = process.env.APP_BASE_PATH ?? (process.env.VERCEL ? "/app" : "");

/** The Boluck backend (docs/FRONTEND_INTEGRATION.md). Its routes sit under `/api/v1`. */
const API_ORIGIN = (process.env.API_PROXY_TARGET || "https://boluck-backend-production.up.railway.app").replace(/\/$/, "");

/**
 * Where the browser sends API calls: this app's own `/api/v1` path, proxied to the backend below, so CORS never
 * applies on any domain (same approach as the Stackly reference). NEXT_PUBLIC_API_URL forces direct calls instead;
 * the backend must then allow this origin.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || `${BASE_PATH}/api/v1`;

const nextConfig: NextConfig = {
	basePath: BASE_PATH,
	// VERCEL_ENV inlined for client code too (lib/site.ts picks production URLs with it).
	env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_API_URL: API_URL, NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "" },
	cacheComponents: true,
	partialPrefetching: true,
	reactCompiler: true,
	poweredByHeader: false,
	transpilePackages: ["@repo/ui", "@repo/stellar"],
	// Dev only: let a phone on the LAN load dev assets / HMR.
	allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
	// Behind Vercel Services the optimizer route does not reach this app, so images are served as they are.
	images: { unoptimized: true },
	// Same-origin API proxy: the browser calls `<basePath>/api/v1/…`, Next forwards it to the backend.
	async rewrites() {
		return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
	},
	async redirects() {
		return [
			{ source: "/dashboard", destination: "/overview", permanent: false },
			{ source: "/bounties/:id/payout", destination: "/bounties/:id/review", permanent: false },
			{ source: "/bounties/:id/cancel", destination: "/refunds?bounty=:id", permanent: false },
		];
	},
};

export default nextConfig;
