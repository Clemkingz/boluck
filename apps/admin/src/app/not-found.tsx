import Link from "next/link";

export default function NotFound() {
	return (
		<div className="grid min-h-dvh place-items-center p-6 text-center">
			<div>
				<p className="font-display text-5xl font-bold text-primary">404</p>
				<h1 className="mt-3 font-display text-xl font-bold text-ink">This console page doesn&apos;t exist.</h1>
				<Link href="/" className="mt-4 inline-block text-sm text-primary hover:underline">
					Back to the overview →
				</Link>
			</div>
		</div>
	);
}
