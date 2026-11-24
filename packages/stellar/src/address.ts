const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const HEX = "0123456789abcdef";

/** Small deterministic PRNG so seeded mock data renders identically on server and client. */
function seeded(seed: string) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i++) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return () => {
		h += 0x6d2b79f5;
		let t = h;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function randomFrom(chars: string, length: number, rand: () => number) {
	let out = "";
	for (let i = 0; i < length; i++) out += chars[Math.floor(rand() * chars.length)];
	return out;
}

/**
 * A Stellar-style public key (G + 55 base32 chars). Mock only: no valid checksum.
 * `prefix`/`suffix` let seeded accounts match the addresses shown in the designs.
 */
export function mockAddress(seed: string, prefix = "G", suffix = "") {
	const middle = randomFrom(BASE32, 56 - prefix.length - suffix.length, seeded(seed));
	return prefix + middle + suffix;
}

/** A 64-char hex transaction hash. Pass a seed for deterministic mock data. */
export function mockTxHash(seed?: string) {
	const rand = seed ? seeded(seed) : Math.random;
	return randomFrom(HEX, 64, rand);
}

export function isStellarAddress(value: string) {
	return /^G[A-Z2-7]{55}$/.test(value.trim());
}
