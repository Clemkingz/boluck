const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
	timeZone: "UTC",
});
const amount2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amount0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatDate(iso: string) {
	return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string) {
	return dateTimeFmt.format(new Date(iso));
}

/** "300.00 USDC" */
export function formatAmount(amount: number, symbol = "USDC") {
	return `${amount2.format(amount)}${symbol ? ` ${symbol}` : ""}`;
}

/** "$300" — the compact money style used across the designs. */
export function formatUsd(amount: number) {
	return `$${amount0.format(amount)}`;
}

/** "GC6X…8QJP" */
export function shortAddress(address?: string, head = 4, tail = 4) {
	if (!address) return "—";
	return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function shortHash(hash: string, size = 6) {
	return `${hash.slice(0, size)}…${hash.slice(-size)}`;
}

/** Zero-padded counters like "03" in the stat cards. */
export function pad2(n: number) {
	return n.toString().padStart(2, "0");
}

/** Whole days from `from` until `iso`. Negative means the date has passed. */
export function daysUntil(iso: string, from: Date = new Date()) {
	return Math.ceil((new Date(iso).getTime() - from.getTime()) / 86_400_000);
}
