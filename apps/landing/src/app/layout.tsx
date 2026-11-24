import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
	metadataBase: SITE_URL,
	title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	keywords: SITE_KEYWORDS,
	authors: [{ name: SITE_NAME }],
	creator: SITE_NAME,
	publisher: SITE_NAME,
	category: "finance",
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		url: "/",
		locale: "en_US",
	},
	twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
	robots: { index: true, follow: true },
	formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
	themeColor: THEME_COLOR,
	colorScheme: "dark",
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} h-full`}>
			<body className="flex min-h-full flex-col">{children}</body>
		</html>
	);
}
