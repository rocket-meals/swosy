import { EmailHelper } from 'repo-depkit-common';

describe('EmailHelper.sanitize', () => {
  it('trims surrounding whitespace', () => {
    expect(EmailHelper.sanitize('  test@example.com  ')).toBe('test@example.com');
  });
});

describe('EmailHelper.isValid', () => {
  it('accepts well-formed email addresses', () => {
    expect(EmailHelper.isValid('test@example.com')).toBe(true);
    expect(EmailHelper.isValid('a.b+c@sub.example.co.uk')).toBe(true);
    expect(EmailHelper.isValid('  spaced@example.com  ')).toBe(true);
  });

  it('rejects malformed email addresses', () => {
    expect(EmailHelper.isValid('not-an-email')).toBe(false);
    expect(EmailHelper.isValid('missing-at.example.com')).toBe(false);
    expect(EmailHelper.isValid('missing-domain@')).toBe(false);
    expect(EmailHelper.isValid('@missing-local.com')).toBe(false);
    expect(EmailHelper.isValid('has spaces@example.com')).toBe(false);
    expect(EmailHelper.isValid('missing-dot@examplecom')).toBe(false);
  });
});

describe('EmailHelper.sanitizeAndValidate', () => {
  it('returns the trimmed email together with its validity', () => {
    expect(EmailHelper.sanitizeAndValidate(' test@example.com ')).toEqual({
      trimmedEmail: 'test@example.com',
      isValid: true,
    });
    expect(EmailHelper.sanitizeAndValidate(' not-an-email ')).toEqual({
      trimmedEmail: 'not-an-email',
      isValid: false,
    });
  });
});

describe('EmailHelper regex reliability (SonarCloud: super-linear regex backtracking)', () => {
  // The rule flagged `^[^\s@]+@[^\s@]+\.[^\s@]+$` for unbounded quantifiers. The fix
  // bounds every quantifier ([^\s@]{1,64} / {1,255} / {1,63}) so a pathological input
  // can never force runtime proportional to an attacker-controlled input length.
  it('rejects very long inputs quickly instead of scanning the whole string', () => {
    const longLocalPartNoAt = `${'a'.repeat(500_000)}@${'b'.repeat(500_000)}.com`;
    const start = Date.now();
    const isValid = EmailHelper.isValid(longLocalPartNoAt);
    const durationMs = Date.now() - start;

    expect(isValid).toBe(false); // local part exceeds the 64 char bound
    expect(durationMs).toBeLessThan(500);
  });

  it('stays fast for a long domain with no dot at all', () => {
    const noDot = `user@${'b'.repeat(500_000)}`;
    const start = Date.now();
    const isValid = EmailHelper.isValid(noDot);
    const durationMs = Date.now() - start;

    expect(isValid).toBe(false);
    expect(durationMs).toBeLessThan(500);
  });
});
