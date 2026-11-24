import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Toaster } from "@repo/ui/toaster";
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
	title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	robots: { index: false, follow: false, nocache: true },
	formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = { themeColor: THEME_COLOR, colorScheme: "dark", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable} h-full`}>
			<body className="flex min-h-full flex-col">
				{children}
				<Toaster />
			</body>
		</html>
	);
}
