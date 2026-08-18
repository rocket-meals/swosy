import { MathHelper } from './MathHelper';

// Random ids for the whole monorepo (frontend apps, backend extension, shared
// packages), built on MathHelper.random() so the repo keeps a single source of
// randomness and no platform specific crypto API is needed - the same code runs
// in React Native, on the web and in node.
//
// The ids are unique enough to group or address local records; they are NOT
// suitable for tokens, secrets or anything else security-sensitive. Math.random()
// is a predictable PRNG: anything an attacker must not be able to guess belongs
// in node:crypto (`crypto.randomBytes`) instead.
export class UuidHelper {
	private static readonly HEX_DIGITS = '0123456789abcdef';

	/** Digits and lower/upper case letters - the alphabet nanoid-style short ids use. */
	static readonly ALPHANUMERIC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

	/** Digits and lower case letters only, for ids that end up in urls or file names. */
	static readonly ALPHANUMERIC_LOWERCASE = '0123456789abcdefghijklmnopqrstuvwxyz';

	// charAt (not [index]) so the helper also compiles for consumers that enable
	// noUncheckedIndexedAccess, where indexing a string yields `string | undefined`.
	private static randomHexDigit(): string {
		return UuidHelper.HEX_DIGITS.charAt(Math.floor(MathHelper.random() * 16));
	}

	/**
	 * Random id in the RFC 4122 version 4 layout, e.g.
	 * "1b4e28ba-2fa1-4d1b-883f-176d3b3f1c8a".
	 *
	 * @returns 36 character UUID string, lower case
	 */
	static randomUUID(): string {
		let uuid = '';
		for (let position = 0; position < 36; position++) {
			if (position === 8 || position === 13 || position === 18 || position === 23) {
				uuid += '-';
			} else if (position === 14) {
				uuid += '4'; // version 4
			} else if (position === 19) {
				// variant: one of 8, 9, a, b
				uuid += UuidHelper.HEX_DIGITS.charAt(8 + Math.floor(MathHelper.random() * 4));
			} else {
				uuid += UuidHelper.randomHexDigit();
			}
		}
		return uuid;
	}

	/**
	 * Short random id of the given length, in the style of nanoid.
	 *
	 * @param length Number of characters, must be at least 1
	 * @param alphabet Characters to pick from, defaults to digits and letters
	 * @returns Random id consisting of exactly `length` characters
	 */
	static randomId(length: number, alphabet: string = UuidHelper.ALPHANUMERIC): string {
		if (!Number.isInteger(length) || length < 1) {
			throw new Error(`UuidHelper.randomId: length must be a positive integer, got ${length}`);
		}
		if (alphabet.length < 2) {
			throw new Error('UuidHelper.randomId: alphabet needs at least two characters');
		}
		let id = '';
		for (let position = 0; position < length; position++) {
			id += alphabet.charAt(Math.floor(MathHelper.random() * alphabet.length));
		}
		return id;
	}
}
