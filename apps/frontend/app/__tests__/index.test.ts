import { extractRawExpoToken } from '../app/index';

describe('extractRawExpoToken', () => {
	it('extracts the raw token from ExponentPushToken[...] notation', () => {
		expect(extractRawExpoToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')).toBe('xxxxxxxxxxxxxxxxxxxxxx');
	});

	it('returns the original token when it has no brackets', () => {
		expect(extractRawExpoToken('already-raw-token')).toBe('already-raw-token');
	});

	it('returns null for null input', () => {
		expect(extractRawExpoToken(null)).toBeNull();
	});

	it('returns null for an empty string', () => {
		expect(extractRawExpoToken('')).toBeNull();
	});
});

describe('extractRawExpoToken regex reliability (SonarCloud: super-linear regex backtracking)', () => {
	// The rule flagged the previous /\[(.+?)\]/ pattern. The fix replaced the lazy `.+?`
	// with a bounded negated character class ([^\]]{1,200}), which cannot backtrack in a
	// way whose cost grows with the size of an attacker-controlled input.
	it('stays fast for a very long token with no closing bracket', () => {
		const pathological = `ExponentPushToken[${'x'.repeat(1_000_000)}`;
		const start = Date.now();
		const result = extractRawExpoToken(pathological);
		const durationMs = Date.now() - start;

		expect(result).toBe(pathological); // no match found, original string returned unchanged
		expect(durationMs).toBeLessThan(500);
	});
});
