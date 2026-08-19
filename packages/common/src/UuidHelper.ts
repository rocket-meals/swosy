import ShortUniqueId from 'short-unique-id';

// Random ids for the whole monorepo (frontend apps, shared packages), wrapping
// the short-unique-id package so no app hand-rolls its own generator. The
// package is pure JavaScript with no node built-ins, so the same code runs in
// React Native, on the web and in node.
//
// short-unique-id draws from Math.random(): the ids are unique enough to group
// or address local records, but they are NOT suitable for tokens, secrets or
// anything else an attacker must not be able to guess - use node:crypto
// (`crypto.randomBytes`) for those.
export class UuidHelper {
	/** Roughly the ~122 random bits an RFC 4122 v4 UUID carries, in 22 characters. */
	static readonly DEFAULT_LENGTH = 22;

	// Building a generator normalizes and shuffles its dictionary, which is the
	// expensive part of short-unique-id. One instance per dictionary is created
	// once here and reused, rather than a fresh instance per call.
	private static readonly alphanumericGenerator = new ShortUniqueId({ dictionary: 'alphanum' });
	private static readonly lowerCaseGenerator = new ShortUniqueId({ dictionary: 'alphanum_lower' });

	private static assertUsableLength(length: number): void {
		if (!Number.isInteger(length) || length < 1) {
			throw new Error(`UuidHelper: length must be a positive integer, got ${length}`);
		}
	}

	/**
	 * Random id built from digits and lower/upper case letters.
	 *
	 * @param length Number of characters, must be a positive integer
	 * @returns Random id consisting of exactly `length` characters
	 */
	static randomUUID(length: number = UuidHelper.DEFAULT_LENGTH): string {
		UuidHelper.assertUsableLength(length);
		return UuidHelper.alphanumericGenerator.randomUUID(length);
	}

	/**
	 * Random id built from digits and lower case letters only, for ids that end
	 * up in urls, file names or anywhere else case is not preserved.
	 *
	 * @param length Number of characters, must be a positive integer
	 * @returns Random id consisting of exactly `length` characters
	 */
	static randomIdLowerCase(length: number = UuidHelper.DEFAULT_LENGTH): string {
		UuidHelper.assertUsableLength(length);
		return UuidHelper.lowerCaseGenerator.randomUUID(length);
	}
}
