// Central place for randomness across the whole monorepo (frontend apps, backend
// extension, shared packages): everything that needs a random number goes through
// MathHelper.random(), so if the underlying RNG ever needs to change, this is the
// only place to touch. Nothing that currently uses it is security-sensitive (local
// ids, shuffles, mock delays, dice rolls - no tokens/secrets), so plain Math.random()
// is fine here - SonarCloud's S2245 still flags it as "security-sensitive" regardless
// of context, hence the NOSONAR below.
export class MathHelper {
	static random(): number {
		return Math.random(); // NOSONAR - not security-sensitive (see class comment above)
	}
}
