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
