import { DatabaseTypes, GuestAccountHelper } from 'repo-depkit-common';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';

/**
 * Gäste bekommen einen Spitznamen wie `Guest_2609232151` und sind nicht verifiziert, alle anderen ein leeres Profil.
 * `verified` muss für Gäste explizit `false` sein: der Datenbank-Default von `profiles.verified` ist `true`.
 */
export function getInitialProfileForUser(user: Pick<DatabaseTypes.DirectusUsers, 'email'>, now: Date = new Date()): Partial<DatabaseTypes.Profiles> {
  if (GuestAccountHelper.isGuestEmail(user.email)) {
    return {
      nickname: GuestAccountHelper.buildDefaultNickname(now, EnvVariableHelper.getTimeZoneString()),
      verified: false,
    };
  }
  return {};
}
