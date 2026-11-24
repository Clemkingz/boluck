import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_TAGLINE, SITE_TITLE } from "@/lib/site";

export const alt = SITE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const mark = await readFile(join(process.cwd(), "public/brand/boluck-mark-512.png"), "base64");
const markSrc = `data:image/png;base64,${mark}`;

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 72,
				background: "linear-gradient(135deg, #0d1b2a 0%, #142538 60%, #1b4332 100%)",
				color: "#e7efea",
				fontFamily: "sans-serif",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 18 }}>
				<img src={markSrc} width={72} height={72} alt="" />
				<div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>
					b<span style={{ color: "#2dd4a8" }}>o</span>luck<span style={{ color: "#2dd4a8" }}>.</span>
				</div>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<div style={{ fontSize: 30, color: "#2dd4a8", fontWeight: 700 }}>Bounty escrow on Stellar</div>
				<div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, fontWeight: 800, lineHeight: 1.1 }}>
					Get paid for work that&apos;s&nbsp;<span style={{ color: "#2dd4a8" }}>already funded.</span>
				</div>
			</div>
			<div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#a7b5ba" }}>
				<span>Escrow-backed bounties · Testnet USDC</span>
				<span>{SITE_TAGLINE}</span>
			</div>
		</div>,
		size,
	);
}
