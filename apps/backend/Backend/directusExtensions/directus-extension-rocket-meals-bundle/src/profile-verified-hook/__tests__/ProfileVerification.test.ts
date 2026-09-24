import { describe, expect, it } from '@jest/globals';
import { GuestAccountHelper } from 'repo-depkit-common';

import { calculateProfilesVerified, collectProfileIds } from '../ProfileVerification';

const guestEmail = GuestAccountHelper.buildEmail('abc');

describe('calculateProfilesVerified', () => {
  it('verifies a profile as soon as one linked account is not a guest', () => {
    const result = calculateProfilesVerified(
      ['p1', 'p2', 'p3'],
      [
        { email: guestEmail, profile: 'p1' },
        { email: 'max@example.org', profile: 'p1' },
        { email: guestEmail, profile: 'p2' },
        { email: null, profile: { id: 'p3' } as any },
      ]
    );
    expect(result.get('p1')).toBe(true);
    expect(result.get('p2')).toBe(false);
    // SSO accounts have no email
    expect(result.get('p3')).toBe(true);
  });

  it('does not verify a profile without accounts', () => {
    expect(calculateProfilesVerified(['p1'], []).get('p1')).toBe(false);
  });
});

describe('collectProfileIds', () => {
  it('accepts ids and expanded relations and drops empty values and duplicates', () => {
    expect(collectProfileIds(['p1', { id: 'p2' }, null, undefined, '', 'p1'])).toEqual(['p1', 'p2']);
  });
});
