/**
 * guest-account-endpoint – legt einen Gast-Account an, ohne dass sich jemand registriert.
 *
 * `POST /guest-accounts` antwortet mit `{ email, password }`. Die App speichert diese Zugangsdaten
 * lokal und meldet sich damit ganz normal per E-Mail und Passwort an. Ab da ist ein Gast für den
 * Server ein gewöhnlicher Nutzer mit der Rolle `User`: Profil (über den `profile-create-hook`),
 * Bewertungen, Kommentare, Chats und Push-Benachrichtigungen laufen über dieselben Policies wie bei
 * registrierten Nutzern. Erkennbar ist ein Gast nur an seiner E-Mail-Adresse unter `guest.example.com`
 * (siehe `GuestAccountHelper`).
 *
 * Die eingebaute Directus-Registrierung (`/users/register`) ist ausgeschaltet und verlangt eine
 * bestätigte E-Mail-Adresse, deshalb gibt es diesen eigenen Endpoint.
 *
 * Schutz:
 * - Nur wenn `app_settings.guest_profiles_enabled` an ist.
 * - Rate-Limit pro IP im Speicher dieses Prozesses, aktuell unbegrenzt (-1): Im Uni-WLAN teilen sich
 *   viele Nutzer per NAT eine IP. Ein passendes Limit ist in Issue #4423 offen. Die IP wird nicht gespeichert.
 * - Das Passwort verlässt den Server genau einmal; gespeichert wird nur der Hash (Directus-Feld `hash`).
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { randomBytes, randomUUID } from 'node:crypto';
import { CollectionNames, DatabaseTypes, GuestAccountCredentials, GuestAccountHelper } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { GuestAccountRateLimiter } from './GuestAccountRateLimiter';

/** Name der Rolle, die Gäste bekommen – dieselbe wie bei registrierten App-Nutzern. */
const GUEST_ROLE_NAME = 'User';

const PASSWORD_BYTES = 32;

const rateLimiter = new GuestAccountRateLimiter();

async function findGuestRoleId(myDatabaseHelper: MyDatabaseHelper): Promise<string | undefined> {
  const rolesHelper = myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.DirectusRoles>(CollectionNames.ROLES);
  const roles = await rolesHelper.readByQuery({
    filter: { name: { _eq: GUEST_ROLE_NAME } },
    fields: ['id'],
    limit: 1,
  });
  return roles[0]?.id;
}

function getClientIp(req: any): string {
  return String(req?.ip || req?.socket?.remoteAddress || 'unknown');
}

export default defineEndpoint({
  id: GuestAccountHelper.ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post('/', async (req: any, res: any) => {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);

      try {
        const appSettings = await myDatabaseHelper.getAppSettingsHelper().getAppSettings();
        if (!appSettings?.guest_profiles_enabled) {
          return res.status(403).json({ error: 'Guest profiles are disabled.' });
        }

        if (!rateLimiter.tryConsume(getClientIp(req))) {
          return res.status(429).json({ error: 'Too many guest accounts created. Please try again later.' });
        }

        const roleId = await findGuestRoleId(myDatabaseHelper);
        if (!roleId) {
          console.error(GuestAccountHelper.ENDPOINT_ID + ': role "' + GUEST_ROLE_NAME + '" not found, cannot create guest account.');
          return res.status(500).json({ error: 'Could not create guest account.' });
        }

        const credentials: GuestAccountCredentials = {
          email: GuestAccountHelper.buildEmail(randomUUID()),
          password: randomBytes(PASSWORD_BYTES).toString('base64url'),
        };

        await myDatabaseHelper.getUsersHelper().createOne({
          email: credentials.email,
          password: credentials.password,
          role: roleId,
          status: 'active',
          provider: 'default',
        });

        res.set('Cache-Control', 'no-store');
        return res.status(201).json(credentials);
      } catch (error) {
        console.error(GuestAccountHelper.ENDPOINT_ID + ': could not create guest account', error);
        return res.status(500).json({ error: 'Could not create guest account.' });
      }
    });
  },
});
