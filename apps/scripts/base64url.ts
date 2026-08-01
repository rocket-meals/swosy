// Deep import so ts-node (target ES2020) only compiles StringHelper.ts instead of the
// whole common package index.
import { StringHelper } from 'repo-depkit-common/src/StringHelper';

// Base64url-encodes a value, per RFC 4648 §5 (used for JWT header/payload segments).
// SonarCloud reliability rule (regex ReDoS): the previous implementation stripped
// padding with /=+$/ (an unbounded quantifier). Base64 padding is always 0-2 characters,
// so the fix bounds it to /={1,2}$/, which is both more precise and cannot scale with
// input size.
export function base64url(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input) : input;
  const base64 = buffer.toString('base64');
  const withDashes = StringHelper.replaceAllLiteralWithOptions({ str: base64, find: '+', replace: '-' });
  const urlSafe = StringHelper.replaceAllLiteralWithOptions({ str: withDashes, find: '/', replace: '_' });
  return urlSafe.replace(/={1,2}$/, '');
}
