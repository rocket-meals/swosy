// Generates a short random suffix for locally-stored ids (activities, routes). Not
// security-sensitive (no tokens/secrets), so plain Math.random() is fine - SonarCloud's
// S2245 still flags it as "security-sensitive" regardless of context, hence the NOSONAR.
export function generateRandomIdSuffix(length = 7): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += alphabet[Math.floor(Math.random() * alphabet.length)]; // NOSONAR - not security-sensitive (local id)
	}
	return result;
}
