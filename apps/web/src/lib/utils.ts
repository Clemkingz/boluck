export { cn } from "@repo/ui/lib/utils";

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
