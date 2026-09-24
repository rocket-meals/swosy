import { PrimaryKey } from '@directus/types';
import { DatabaseTypes, GuestAccountHelper } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

type LinkedAccount = Pick<DatabaseTypes.DirectusUsers, 'email' | 'profile'>;

function getProfileId(account: LinkedAccount): string | undefined {
  const profile = account.profile;
  if (typeof profile === 'string') {
    return profile;
  }
  return profile?.id;
}

/**
 * `verified` für jedes der angegebenen Profile, berechnet aus den Accounts, die daran hängen.
 * Ein Profil ohne Accounts ist nicht verifiziert.
 */
export function calculateProfilesVerified(profileIds: string[], linkedAccounts: LinkedAccount[]): Map<string, boolean> {
  const result = new Map<string, boolean>();
  for (const profileId of profileIds) {
    const emails = linkedAccounts.filter(account => getProfileId(account) === profileId).map(account => account.email);
    result.set(profileId, GuestAccountHelper.isVerifiedProfile(emails));
  }
  return result;
}

export function collectProfileIds(values: unknown[]): string[] {
  const ids = values.map(value => (typeof value === 'object' && value !== null ? (value as { id?: unknown }).id : value)).filter((id): id is string => typeof id === 'string' && id.length > 0);
  return [...new Set(ids)];
}

/** Schreibt `profiles.verified` neu. Läuft immer als Admin, Nutzer dürfen das Feld nicht ändern. */
export class ProfileVerification {
  constructor(private readonly myDatabaseHelper: MyDatabaseHelper) {}

  async readProfileIdsOfUsers(userIds: PrimaryKey[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const users = await this.myDatabaseHelper.getUsersHelper().readMany(userIds, { fields: ['id', 'profile'] });
    return collectProfileIds(users.map(user => user.profile));
  }

  async recalculate(profileIds: string[]): Promise<void> {
    if (profileIds.length === 0) {
      return;
    }
    const linkedAccounts = await this.myDatabaseHelper.getUsersHelper().readByQuery({
      filter: { profile: { _in: profileIds } },
      fields: ['id', 'email', 'profile'],
      limit: -1,
    });
    const profiles = await this.myDatabaseHelper.getProfilesHelper().readMany(profileIds, { fields: ['id', 'verified'] });
    const verifiedByProfile = calculateProfilesVerified(
      profiles.map(profile => profile.id),
      linkedAccounts
    );

    const changedTo = (verified: boolean) => profiles.filter(profile => verifiedByProfile.get(profile.id) === verified && profile.verified !== verified).map(profile => profile.id);
    const nowVerified = changedTo(true);
    const nowUnverified = changedTo(false);
    if (nowVerified.length > 0) {
      await this.myDatabaseHelper.getProfilesHelper().updateMany(nowVerified, { verified: true });
    }
    if (nowUnverified.length > 0) {
      await this.myDatabaseHelper.getProfilesHelper().updateMany(nowUnverified, { verified: false });
    }
  }
}
