// Generates a short random suffix for locally-stored ids (activities, routes). These ids are
// never used for anything security-sensitive (no tokens/secrets), but we still prefer a CSPRNG
// over Math.random() when the runtime provides one, to avoid predictable local id collisions.
export function generateRandomIdSuffix(length = 7): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const cryptoObj: Crypto | undefined = typeof globalThis !== 'undefined' ? (globalThis as unknown as { crypto?: Crypto }).crypto : undefined;

	if (cryptoObj?.getRandomValues) {
		const bytes = new Uint8Array(length);
		cryptoObj.getRandomValues(bytes);
		return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
	}

	// Fallback for the rare runtime without a CSPRNG: derive entropy from high-resolution
	// timing instead of Math.random().
	const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
	let seed = Math.floor(now * 1000) ^ Date.now();
	let result = '';
	for (let i = 0; i < length; i++) {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		result += alphabet[seed % alphabet.length];
	}
	return result;
}
