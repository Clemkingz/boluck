import type { MetadataRoute } from "next";

/** The app sits behind a wallet; only the landing site is indexed. */
export default function robots(): MetadataRoute.Robots {
	return { rules: [{ userAgent: "*", disallow: "/" }] };
}
