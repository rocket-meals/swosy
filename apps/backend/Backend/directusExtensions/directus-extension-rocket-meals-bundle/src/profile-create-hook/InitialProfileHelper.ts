import { DatabaseTypes, GuestAccountHelper } from 'repo-depkit-common';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';

/** Gäste bekommen einen Spitznamen wie `Guest_2609232151`, alle anderen ein leeres Profil. */
export function getInitialProfileForUser(user: Pick<DatabaseTypes.DirectusUsers, 'email'>, now: Date = new Date()): Partial<DatabaseTypes.Profiles> {
  if (GuestAccountHelper.isGuestEmail(user.email)) {
    return { nickname: GuestAccountHelper.buildDefaultNickname(now, EnvVariableHelper.getTimeZoneString()) };
  }
  return {};
}
