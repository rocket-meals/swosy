// Central place for randomness: every part of the app gets dice rolls and local ids
// from this one function, so if the underlying RNG ever needs to change, this is the
// only place to touch. Delegates to the repo-wide MathHelper/UuidHelper
// (repo-depkit-common) rather than hand-rolling anything here.

import { MathHelper, UuidHelper } from 'repo-depkit-common';

const ID_SUFFIX_LENGTH = 6;

/** Single source of randomness for the whole app - swap the implementation here only. */
function randomFloat(): number {
	return MathHelper.random();
}

/** Uniform random integer in [1, sides] - e.g. a die roll. */
export function randomDieValue(sides: number): number {
	if (sides <= 1) return 1;
	return Math.floor(randomFloat() * sides) + 1;
}

/** Unique-enough id for locally stored records: creation time plus a random suffix. */
export function generateId(): string {
	return Date.now().toString(36) + UuidHelper.randomId(ID_SUFFIX_LENGTH, UuidHelper.ALPHANUMERIC_LOWERCASE);
}
