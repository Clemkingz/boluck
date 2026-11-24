"use client";

/**
 * Last-resort error boundary. It replaces the root layout, so global CSS and
 * fonts may be missing — styles are inline and self-contained.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
	console.error(error);
	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: "100dvh",
					display: "grid",
					placeItems: "center",
					background: "#0d1b2a",
					color: "#e7efea",
					fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
					padding: 24,
					textAlign: "center",
				}}
			>
				<title>Something went wrong · Boluck</title>
				<main style={{ maxWidth: 440 }}>
					<p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
						b<span style={{ color: "#2dd4a8" }}>o</span>luck<span style={{ color: "#2dd4a8" }}>.</span>
					</p>
					<h1 style={{ fontSize: 26, margin: "32px 0 8px" }}>Boluck hit an unexpected error.</h1>
					<p style={{ color: "#a7b5ba", lineHeight: 1.6, margin: 0 }}>
						No transaction was signed and no funds moved. Reload to try again.
					</p>
					<button
						onClick={retry}
						style={{
							marginTop: 28,
							height: 44,
							padding: "0 22px",
							borderRadius: 6,
							border: 0,
							background: "#2dd4a8",
							color: "#0d1b2a",
							fontWeight: 600,
							fontSize: 15,
							cursor: "pointer",
						}}
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
