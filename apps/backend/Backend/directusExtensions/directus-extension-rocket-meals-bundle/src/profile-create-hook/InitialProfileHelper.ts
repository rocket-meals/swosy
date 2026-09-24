import { DatabaseTypes, GuestAccountHelper } from 'repo-depkit-common';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';

/**
 * Gäste bekommen einen Spitznamen wie `Guest_2609232151` und ein nicht verifiziertes Profil,
 * alle anderen ein leeres, verifiziertes Profil. Später verknüpfte Accounts pflegt der
 * `profile-verified-hook` nach.
 */
export function getInitialProfileForUser(user: Pick<DatabaseTypes.DirectusUsers, 'email'>, now: Date = new Date()): Partial<DatabaseTypes.Profiles> {
  const verified = GuestAccountHelper.isVerifiedProfile([user.email]);
  if (GuestAccountHelper.isGuestEmail(user.email)) {
    return { nickname: GuestAccountHelper.buildDefaultNickname(now, EnvVariableHelper.getTimeZoneString()), verified };
  }
  return { verified };
}
