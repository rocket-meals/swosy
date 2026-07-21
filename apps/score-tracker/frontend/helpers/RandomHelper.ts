// Central place for randomness so we never reach for Math.random() directly. The generated
// values are not security-sensitive (local ids and dice rolls, no tokens/secrets), but we
// still prefer a CSPRNG when the runtime provides one, to avoid predictable sequences and
// to keep static analysis (SonarCloud S2245) happy.

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function getCrypto(): Crypto | undefined {
	return typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: Crypto }).crypto : undefined;
}

// Fallback for the rare runtime without a CSPRNG: derive entropy from high-resolution
// timing instead of Math.random(). The seed lives at module scope and is only
// initialised once - some runtimes (Hermes on-device, this project's jest
// setup) expose `performance.now()` with the same millisecond resolution as
// `Date.now()`, so reseeding from wall-clock time on every call would make
// several values requested within the same millisecond (e.g. rolling a whole
// pool of dice at once) come out identical.
let fallbackSeed: number | undefined;

function nextFallbackByte(): number {
	if (fallbackSeed === undefined) {
		const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
		fallbackSeed = (Math.floor(now * 1000) ^ Date.now()) & 0x7fffffff;
	}
	// Math.imul keeps the multiplication within exact 32-bit integer arithmetic.
	// A plain `seed * 1103515245` overflows Number.MAX_SAFE_INTEGER and silently
	// loses its low bits, which made every extracted byte (and thus every die
	// roll) collapse to the same value.
	fallbackSeed = (Math.imul(fallbackSeed, 1103515245) + 12345) & 0x7fffffff;
	return fallbackSeed & 0xff;
}

function fallbackRandomBytes(length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[i] = nextFallbackByte();
	}
	return bytes;
}

function randomBytes(length: number): Uint8Array {
	const cryptoObj = getCrypto();
	if (cryptoObj?.getRandomValues) {
		const bytes = new Uint8Array(length);
		cryptoObj.getRandomValues(bytes);
		return bytes;
	}
	return fallbackRandomBytes(length);
}

/** Uniform random integer in [1, sides] - e.g. a die roll. Uses rejection sampling to avoid modulo bias. */
export function randomDieValue(sides: number): number {
	if (sides <= 1) return 1;
	// Largest multiple of `sides` that fits in a byte range wide enough for the request.
	const byteCount = sides <= 256 ? 1 : 2;
	const range = byteCount === 1 ? 256 : 65536;
	const limit = range - (range % sides);
	for (;;) {
		const bytes = randomBytes(byteCount);
		const value = byteCount === 1 ? bytes[0] : (bytes[0] << 8) | bytes[1];
		if (value < limit) return (value % sides) + 1;
	}
}

/** Unique-enough id for locally stored records: creation time plus a random suffix. */
export function generateId(): string {
	const suffix = Array.from(randomBytes(6), byte => ID_ALPHABET[byte % ID_ALPHABET.length]).join('');
	return Date.now().toString(36) + suffix;
}
