/**
 * Gast-Accounts: echte Directus-User, deren Zugangsdaten die App selbst erzeugen lässt und
 * lokal speichert. Für den Server ist ein Gast ein normaler Nutzer mit Profil – erkennbar
 * nur an der E-Mail-Adresse unter `guest.example.com`.
 *
 * `example.com` ist nach RFC 2606 reserviert und hat keinen Mailserver (Null-MX, RFC 7505):
 * An diese Adressen kann nie eine Mail zugestellt werden. Die eigentlich passendere Endung
 * `.invalid` geht nicht, weil Directus beim Login nur E-Mail-Adressen mit echter Top-Level-Domain
 * annimmt („"email" must be a valid email“).
 */

export type GuestAccountCredentials = {
  email: string;
  password: string;
};

export class GuestAccountHelper {
  /** Pfad des Endpoints `POST /guest-accounts` im Backend-Bundle. */
  static readonly ENDPOINT_ID = 'guest-accounts';

  static readonly EMAIL_DOMAIN = 'guest.example.com';

  private static readonly EMAIL_PREFIX = 'guest-';

  static buildEmail(id: string): string {
    return GuestAccountHelper.EMAIL_PREFIX + id.trim().toLowerCase() + '@' + GuestAccountHelper.EMAIL_DOMAIN;
  }

  static isGuestEmail(email: string | null | undefined): boolean {
    if (!email) {
      return false;
    }
    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail.startsWith(GuestAccountHelper.EMAIL_PREFIX) && normalizedEmail.endsWith('@' + GuestAccountHelper.EMAIL_DOMAIN);
  }

  /**
   * Ein Profil ist verifiziert, sobald mindestens einer seiner Accounts kein Gast ist – also eine
   * eigene E-Mail-Adresse hat oder per SSO angemeldet ist (SSO-Accounts haben keine E-Mail).
   * Das Ergebnis steht in `profiles.verified` und wird vom Backend gepflegt.
   */
  static isVerifiedProfile(linkedAccountEmails: (string | null | undefined)[]): boolean {
    return linkedAccountEmails.some(email => !GuestAccountHelper.isGuestEmail(email));
  }

  /**
   * Gilt für diesen Nutzer die Gast-Einschränkung? Nur wenn er mit einem Gast-Account angemeldet
   * ist und sein Profil nicht über einen weiteren, echten Account verifiziert ist.
   */
  static isRestrictedGuest(email: string | null | undefined, profileVerified: boolean | null | undefined): boolean {
    return GuestAccountHelper.isGuestEmail(email) && profileVerified !== true;
  }

  private static readonly DEFAULT_NICKNAME_PREFIX = 'Guest_';

  /**
   * Spitzname, den ein Gast-Profil beim Anlegen bekommt: `Guest_<YYMMDDHHmm>` in der
   * angegebenen Zeitzone, z. B. `Guest_2609232151` für den 23.09.2026, 21:51 Uhr.
   */
  static buildDefaultNickname(date: Date, timeZone: string = 'Europe/Berlin'): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '00';
    return GuestAccountHelper.DEFAULT_NICKNAME_PREFIX + part('year') + part('month') + part('day') + part('hour') + part('minute');
  }

  static isValidCredentials(value: unknown): value is GuestAccountCredentials {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const credentials = value as Partial<GuestAccountCredentials>;
    return (
      typeof credentials.email === 'string' &&
      GuestAccountHelper.isGuestEmail(credentials.email) &&
      typeof credentials.password === 'string' &&
      credentials.password.length > 0
    );
  }
}
