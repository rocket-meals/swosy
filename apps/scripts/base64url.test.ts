import { base64url } from './base64url';

describe('base64url correctness', () => {
	it('strips base64 padding and swaps to URL-safe characters', () => {
		expect(base64url('a')).toBe('YQ');
		expect(base64url('ab')).toBe('YWI');
		expect(base64url('abc')).toBe('YWJj');
	});

	it('replaces "+" and "/" with "-" and "_"', () => {
		// Bytes chosen so the base64 encoding contains both '+' and '/'.
		const input = Buffer.from([0xfb, 0xff, 0xbf]);
		const standardBase64 = input.toString('base64');
		expect(standardBase64).toContain('+');
		expect(standardBase64).toContain('/');

		const result = base64url(input);
		expect(result).not.toContain('+');
		expect(result).not.toContain('/');
		expect(result).not.toContain('=');
	});
});

describe('base64url regex reliability (SonarCloud: super-linear regex backtracking)', () => {
	// The rule flagged the previous /=+$/ padding-strip pattern for an unbounded
	// quantifier. Base64 padding is always 0-2 characters, so the fix bounds it to
	// /={1,2}$/, which is both more precise and cannot scale with input size.
	it('stays fast and correct for a large input', () => {
		const largeInput = 'x'.repeat(1_000_000);
		const start = Date.now();
		const result = base64url(largeInput);
		const durationMs = Date.now() - start;

		expect(result).not.toContain('=');
		expect(durationMs).toBeLessThan(500);
	});
});
