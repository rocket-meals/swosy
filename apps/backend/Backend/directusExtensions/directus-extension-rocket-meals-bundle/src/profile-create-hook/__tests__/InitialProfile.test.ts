import { describe, expect, it } from '@jest/globals';
import { GuestAccountHelper } from 'repo-depkit-common';
import { getInitialProfileForUser } from '../InitialProfileHelper';

describe('getInitialProfileForUser', () => {
  const now = new Date('2026-09-23T19:51:00Z');

  it('gives guests the default nickname Guest_<YYMMDDHHmm>', () => {
    const profile = getInitialProfileForUser({ email: GuestAccountHelper.buildEmail('abc') }, now);
    expect(profile.nickname).toMatch(/^Guest_\d{10}$/);
  });

  it('marks guest profiles as not verified', () => {
    expect(getInitialProfileForUser({ email: GuestAccountHelper.buildEmail('abc') }, now).verified).toBe(false);
  });

  it('gives other users an empty, verified profile', () => {
    expect(getInitialProfileForUser({ email: 'someone@example.com' }, now)).toEqual({ verified: true });
    // SSO accounts have no email
    expect(getInitialProfileForUser({ email: null }, now)).toEqual({ verified: true });
  });
});
