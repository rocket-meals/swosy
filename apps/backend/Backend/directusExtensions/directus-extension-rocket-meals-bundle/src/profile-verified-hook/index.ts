/**
 * profile-verified-hook – pflegt `profiles.verified`.
 *
 * Ein Profil kann mehrere Accounts haben (`directus_users.profile`). Es ist verifiziert, sobald
 * mindestens einer davon kein Gast-Account ist (siehe `GuestAccountHelper.isVerifiedProfile`).
 * Ein Gast, dessen Profil so verifiziert ist, unterliegt nicht den Gast-Einschränkungen
 * (z. B. `food-feedback-guest-restriction-hook`).
 *
 * - Beim Anlegen setzt der `profile-create-hook` den Wert direkt.
 * - Ändert sich an einem Account `profile` oder `email`, oder wird er gelöscht, werden das alte und
 *   das neue Profil neu berechnet. Das alte Profil kennt nur der Filter vor der Änderung, deshalb
 *   merkt er es sich bis zur Action danach.
 * - Profile ohne Wert (aus der Zeit vor diesem Feld) zieht ein Schedule nach.
 */

import { PrimaryKey } from '@directus/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { collectProfileIds, ProfileVerification } from './ProfileVerification';

const HOOK_NAME = 'profile-verified-hook';
const USERS_UPDATE_EVENT = 'users.update';
const USERS_DELETE_EVENT = 'users.delete';
const BACKFILL_BATCH_SIZE = 500;

function toKeys(value: unknown): PrimaryKey[] {
  return Array.isArray(value) ? (value as PrimaryKey[]) : [];
}

function toMapKey(keys: PrimaryKey[]): string {
  return keys.map(String).sort().join(',');
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ filter, action, schedule }, apiContext) => {
  const profileVerification = new ProfileVerification(new MyDatabaseHelper(apiContext));
  // Profiles the users had before an update/delete, keyed by the affected user ids.
  const previousProfileIds = new Map<string, string[]>();

  async function rememberPreviousProfiles(event: string, keys: PrimaryKey[]) {
    if (keys.length === 0) {
      return;
    }
    try {
      previousProfileIds.set(event + ':' + toMapKey(keys), await profileVerification.readProfileIdsOfUsers(keys));
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not read the previous profiles: ${error}`);
    }
  }

  async function recalculateAfter(event: string, keys: PrimaryKey[], additionalProfileIds: string[]) {
    const mapKey = event + ':' + toMapKey(keys);
    const profileIds = collectProfileIds([...(previousProfileIds.get(mapKey) ?? []), ...additionalProfileIds]);
    previousProfileIds.delete(mapKey);
    try {
      await profileVerification.recalculate(profileIds);
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not recalculate profiles ${profileIds.join(', ')}: ${error}`);
    }
  }

  function touchesVerification(payload: Partial<DatabaseTypes.DirectusUsers> | undefined): boolean {
    return !!payload && ('profile' in payload || 'email' in payload);
  }

  filter(USERS_UPDATE_EVENT, async (input, meta) => {
    if (touchesVerification(input as Partial<DatabaseTypes.DirectusUsers>)) {
      await rememberPreviousProfiles(USERS_UPDATE_EVENT, toKeys(meta?.keys));
    }
    return input;
  });

  action(USERS_UPDATE_EVENT, async meta => {
    const payload = meta?.payload as Partial<DatabaseTypes.DirectusUsers> | undefined;
    if (!touchesVerification(payload)) {
      return;
    }
    const keys = toKeys(meta?.keys);
    // With only the email changed the profile is not in the payload, the previous one is the current one.
    await recalculateAfter(USERS_UPDATE_EVENT, keys, collectProfileIds([payload?.profile]));
  });

  action('users.create', async meta => {
    const payload = meta?.payload as Partial<DatabaseTypes.DirectusUsers> | undefined;
    const profileIds = collectProfileIds([payload?.profile]);
    if (profileIds.length > 0) {
      await recalculateAfter('users.create', [], profileIds);
    }
  });

  filter(USERS_DELETE_EVENT, async input => {
    await rememberPreviousProfiles(USERS_DELETE_EVENT, toKeys(input));
    return input;
  });

  action(USERS_DELETE_EVENT, async meta => {
    await recalculateAfter(USERS_DELETE_EVENT, toKeys(meta?.keys ?? meta?.payload), []);
  });

  // Profiles created before this field existed.
  schedule('30 * * * * *', async () => {
    try {
      const profiles = await new MyDatabaseHelper(apiContext).getProfilesHelper().readByQuery({
        filter: { verified: { _null: true } },
        fields: ['id'],
        limit: BACKFILL_BATCH_SIZE,
      });
      await profileVerification.recalculate(profiles.map(profile => profile.id));
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not backfill profiles: ${error}`);
    }
  });
});
