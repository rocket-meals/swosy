import { MathHelper } from './MathHelper';

// Random ids for the whole monorepo (frontend apps, backend extension, shared
// packages), built on MathHelper.random() so the repo keeps a single source of
// randomness and no platform specific crypto API is needed - the same code runs
// in React Native, on the web and in node.
//
// The ids are unique enough to group or address local records; they are NOT
// suitable for tokens, secrets or anything else security-sensitive.
export class UuidHelper {
	private static readonly HEX_DIGITS = '0123456789abcdef';

	private static randomHexDigit(): string {
		return UuidHelper.HEX_DIGITS[Math.floor(MathHelper.random() * 16)];
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
				uuid += UuidHelper.HEX_DIGITS[8 + Math.floor(MathHelper.random() * 4)];
			} else {
				uuid += UuidHelper.randomHexDigit();
			}
		}
		return uuid;
	}
}
