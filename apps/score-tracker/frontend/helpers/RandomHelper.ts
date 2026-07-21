// Central place for randomness: every part of the app gets dice rolls and local ids
// from this one function, so if the underlying RNG ever needs to change, this is the
// only place to touch. Nothing here is security-sensitive (local ids, dice rolls, no
// tokens/secrets), so plain Math.random() is fine - SonarCloud's S2245 still flags it
// as "security-sensitive" regardless of context, hence the NOSONAR below.

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Single source of randomness for the whole app - swap the implementation here only. */
function randomFloat(): number {
	return Math.random(); // NOSONAR - not security-sensitive (dice rolls / local ids)
}

/** Uniform random integer in [1, sides] - e.g. a die roll. */
export function randomDieValue(sides: number): number {
	if (sides <= 1) return 1;
	return Math.floor(randomFloat() * sides) + 1;
}

/** Unique-enough id for locally stored records: creation time plus a random suffix. */
export function generateId(): string {
	let suffix = '';
	for (let i = 0; i < 6; i++) {
		suffix += ID_ALPHABET[Math.floor(randomFloat() * ID_ALPHABET.length)];
	}
	return Date.now().toString(36) + suffix;
}
