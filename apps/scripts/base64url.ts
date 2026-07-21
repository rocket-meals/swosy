// Base64url-encodes a value, per RFC 4648 §5 (used for JWT header/payload segments).
// SonarCloud reliability rule (regex ReDoS): the previous implementation stripped
// padding with /=+$/ (an unbounded quantifier). Base64 padding is always 0-2 characters,
// so the fix bounds it to /={1,2}$/, which is both more precise and cannot scale with
// input size.
export function base64url(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;
  return buffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/={1,2}$/, '');
}
