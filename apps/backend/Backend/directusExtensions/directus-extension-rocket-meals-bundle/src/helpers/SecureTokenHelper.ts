import crypto from 'node:crypto';

/**
 * Tokens that an attacker must not be able to guess.
 *
 * These are deliberately NOT generated through the repo wide random helpers
 * (`MathHelper` / `UuidHelper` in repo-depkit-common): those sit on
 * `Math.random()`, a predictable PRNG whose internal state can be recovered
 * from a handful of observed outputs. Session tokens are generated from
 * `node:crypto` instead, which the same extension already relies on for
 * authorization and state codes.
 */
export class SecureTokenHelper {
  /** 32 bytes -> 64 hex characters, the width `directus_sessions.token` expects. */
  private static readonly SESSION_TOKEN_BYTES = 32;

  /**
   * Refresh token for a row in `directus_sessions`.
   *
   * @returns 64 character hex string carrying 256 bits of entropy
   */
  public static generateSessionToken(): string {
    return crypto.randomBytes(SecureTokenHelper.SESSION_TOKEN_BYTES).toString('hex');
  }
}
