import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, THEME_COLOR } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: SITE_TITLE,
		short_name: SITE_NAME,
		description: SITE_DESCRIPTION,
		start_url: `${BASE_PATH}/overview`,
		display: "standalone",
		background_color: THEME_COLOR,
		theme_color: THEME_COLOR,
		icons: [
			{ src: `${BASE_PATH}/icon.png`, sizes: "512x512", type: "image/png" },
			{ src: `${BASE_PATH}/apple-icon.png`, sizes: "180x180", type: "image/png" },
		],
	};
}
