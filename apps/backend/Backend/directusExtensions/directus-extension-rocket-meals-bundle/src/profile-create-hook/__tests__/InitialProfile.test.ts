import { describe, expect, it } from '@jest/globals';
import { DefaultProfileHelper, FAMOUS_SCIENTISTS, GuestAccountHelper } from 'repo-depkit-common';
import { getInitialProfileForUser } from '../InitialProfileHelper';

describe('getInitialProfileForUser', () => {
  const guest = { email: GuestAccountHelper.buildEmail('abc') };

  it('gives guests a scientist nickname with the matching avatar', () => {
    const profile = getInitialProfileForUser(guest, () => 0);
    expect(profile.nickname).toBe(FAMOUS_SCIENTISTS[0]!.nickname + '_0000');
    expect(profile.avatar).toEqual(DefaultProfileHelper.buildAvatar(FAMOUS_SCIENTISTS[0]!));
  });

  it('gives SSO users (Apple, Google, …) a scientist nickname and avatar as well', () => {
    for (const email of ['someone@privaterelay.appleid.com', 'someone@gmail.com', null]) {
      const profile = getInitialProfileForUser({ email });
      expect(DefaultProfileHelper.isDefaultNickname(profile.nickname)).toBe(true);
      expect(DefaultProfileHelper.isDefaultAvatar(profile.avatar)).toBe(true);
    }
  });

  it('marks guests as not verified, because the database default of profiles.verified is true', () => {
    expect(getInitialProfileForUser(guest).verified).toBe(false);
  });

  it('leaves verified of other users to the database default', () => {
    expect(getInitialProfileForUser({ email: 'someone@example.com' })).not.toHaveProperty('verified');
  });
});
