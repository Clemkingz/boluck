import type { NextConfig } from "next";

/**
 * The admin console. On Vercel it is a service under `/admin` of the shared host (root `vercel.json`); in dev it
 * runs at the root of localhost:3001. Set ADMIN_BASE_PATH="" once it has its own domain.
 */
const BASE_PATH = process.env.ADMIN_BASE_PATH ?? (process.env.VERCEL ? "/admin" : "");

/** The Boluck backend. Its routes sit under `/api/v1`. */
const API_ORIGIN = (process.env.API_PROXY_TARGET || "https://boluck-backend-production.up.railway.app").replace(/\/$/, "");

/** Same-origin API proxy (like apps/web): the browser calls `<basePath>/api/v1/…`, so CORS never applies. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || `${BASE_PATH}/api/v1`;

const nextConfig: NextConfig = {
	basePath: BASE_PATH,
	env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH, NEXT_PUBLIC_API_URL: API_URL },
	reactCompiler: true,
	poweredByHeader: false,
	transpilePackages: ["@repo/ui", "@repo/stellar"],
	allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
	images: { unoptimized: true },
	async rewrites() {
		return [{ source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` }];
	},
	// The console must never be indexed or framed.
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{ key: "X-Robots-Tag", value: "noindex, nofollow" },
					{ key: "X-Frame-Options", value: "DENY" },
					{ key: "Referrer-Policy", value: "same-origin" },
				],
			},
		];
	},
};

export default nextConfig;
