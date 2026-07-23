import { emailRegex } from './EmailInput';

describe('EmailInput emailRegex correctness', () => {
	it('accepts well-formed email addresses', () => {
		expect(emailRegex.test('test@example.com')).toBe(true);
		expect(emailRegex.test('a.b+c@sub.example.co.uk')).toBe(true);
	});

	it('rejects malformed email addresses', () => {
		expect(emailRegex.test('not-an-email')).toBe(false);
		expect(emailRegex.test('missing-domain@')).toBe(false);
		expect(emailRegex.test('@missing-local.com')).toBe(false);
		expect(emailRegex.test('has spaces@example.com')).toBe(false);
	});
});

describe('EmailInput emailRegex reliability (SonarCloud: super-linear regex backtracking)', () => {
	// The rule flagged the previous `^[^\s@]+@[^\s@]+\.[^\s@]+$` pattern for unbounded
	// quantifiers. The fix bounds each part ({1,64} / {1,255} / {1,63}) so a pathological
	// input can't force runtime proportional to an attacker-controlled input length.
	it('stays fast for a very long, non-matching input', () => {
		const pathological = `${'a'.repeat(500_000)}@${'b'.repeat(500_000)}`;
		const start = Date.now();
		const isValid = emailRegex.test(pathological);
		const durationMs = Date.now() - start;

		expect(isValid).toBe(false);
		expect(durationMs).toBeLessThan(500);
	});
});
