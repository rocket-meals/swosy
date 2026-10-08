import { DatabaseTypes, DefaultProfileHelper, GuestAccountHelper, RandomSource } from 'repo-depkit-common';

/**
 * Jedes neue Profil – Gast, Apple, Google oder anderes SSO – startet mit einer bekannten Wissenschaftlerin bzw.
 * einem bekannten Wissenschaftler: Spitzname wie `Curie_4821` und der passende Avatar. Die App zeigt beides im
 * Onboarding und lädt zum Anpassen ein.
 * `verified` muss für Gäste explizit `false` sein: der Datenbank-Default von `profiles.verified` ist `true`.
 */
export function getInitialProfileForUser(user: Pick<DatabaseTypes.DirectusUsers, 'email'>, random: RandomSource = Math.random): Partial<DatabaseTypes.Profiles> {
  const defaultProfile = DefaultProfileHelper.buildDefaultProfile(random);
  const profile: Partial<DatabaseTypes.Profiles> = {
    nickname: defaultProfile.nickname,
    avatar: defaultProfile.avatar,
  };
  if (GuestAccountHelper.isGuestEmail(user.email)) {
    profile.verified = false;
  }
  return profile;
}
