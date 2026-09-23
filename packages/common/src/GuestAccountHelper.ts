/**
 * Gast-Accounts: echte Directus-User, deren Zugangsdaten die App selbst erzeugen lässt und
 * lokal speichert. Für den Server ist ein Gast ein normaler Nutzer mit Profil – erkennbar
 * nur an der E-Mail-Adresse unter der reservierten Domain `guest.invalid` (RFC 2606),
 * an die nie eine Mail zugestellt werden kann.
 */

export type GuestAccountCredentials = {
  email: string;
  password: string;
};

export class GuestAccountHelper {
  /** Pfad des Endpoints `POST /guest-accounts` im Backend-Bundle. */
  static readonly ENDPOINT_ID = 'guest-accounts';

  static readonly EMAIL_DOMAIN = 'guest.invalid';

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
