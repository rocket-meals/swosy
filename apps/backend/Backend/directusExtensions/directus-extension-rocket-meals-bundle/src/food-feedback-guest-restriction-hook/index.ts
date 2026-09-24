/**
 * food-feedback-guest-restriction-hook – setzt die Gast-Einstellungen für Speisen-Rückmeldungen
 * serverseitig durch.
 *
 * Gäste (siehe `GuestAccountHelper`) haben dieselbe Rolle `User` wie registrierte Nutzer, die
 * Directus-Policies können sie also nicht unterscheiden. Deshalb prüft dieser Hook beim Anlegen und
 * Ändern von `foods_feedbacks`, ob ein Gast gerade eine Bewertung oder einen Kommentar setzt, obwohl
 * `app_settings.foods_ratings_guests_enabled` bzw. `app_settings.foods_feedbacks_comments_type_guests`
 * das verbieten (Auswertung in `FoodFeedbackPermissionHelper`). Die App blendet die Eingaben für
 * Gäste bereits aus; dieser Hook fängt ältere App-Versionen und direkte API-Aufrufe ab.
 */

import { defineHook } from '@directus/extensions-sdk';
import { Accountability, PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, FoodFeedbackPermissionHelper, GuestAccountHelper } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { BackendTranslator, ProfileWithLanguage } from '../helpers/translations';
import { findGuestFoodFeedbackViolation } from './GuestFoodFeedbackRestriction';

const HOOK_NAME = 'food-feedback-guest-restriction-hook';

export default defineHook(async ({ filter }, apiContext) => {
  async function readActingGuest(myDatabaseHelper: MyDatabaseHelper, accountability: Accountability | null | undefined): Promise<DatabaseTypes.DirectusUsers | undefined> {
    const userId = accountability?.user;
    if (!userId) {
      // Internal calls without a user (other hooks, schedules) are never guests.
      return undefined;
    }
    const user = await myDatabaseHelper.getUsersHelper().readOne(userId, {
      // The profile carries the language the error message has to be rendered in.
      fields: ['id', 'email', 'profile.language'],
    });
    return GuestAccountHelper.isGuestEmail(user?.email) ? user : undefined;
  }

  async function readExistingFeedbacks(myDatabaseHelper: MyDatabaseHelper, keys: PrimaryKey[]): Promise<DatabaseTypes.FoodsFeedbacks[]> {
    if (keys.length === 0) {
      return [];
    }
    return await myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.FoodsFeedbacks>(CollectionNames.FOODS_FEEDBACKS).readMany(keys, {
      fields: ['id', 'rating', 'comment'],
    });
  }

  async function assertGuestMayWrite(input: unknown, keys: PrimaryKey[], eventContext: MyEventContext) {
    const payload = (input ?? {}) as Partial<DatabaseTypes.FoodsFeedbacks>;
    if (!('rating' in payload) && !('comment' in payload)) {
      return;
    }

    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const guest = await readActingGuest(myDatabaseHelper, eventContext?.accountability);
    if (!guest) {
      return;
    }

    const appSettings = await myDatabaseHelper.getAppSettingsHelper().getAppSettings();
    const permissions = FoodFeedbackPermissionHelper.getPermissions(appSettings, true);
    const existingFeedbacks = await readExistingFeedbacks(myDatabaseHelper, keys);
    const violation = findGuestFoodFeedbackViolation(payload, existingFeedbacks, permissions);
    if (!violation) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked ${violation} for guest ${guest.id}`);
    const profile = typeof guest.profile === 'object' ? (guest.profile as ProfileWithLanguage) : undefined;
    throw createMyForbiddenError(BackendTranslator.getTranslatorForProfile(profile)(violation));
  }

  filter(CollectionNames.FOODS_FEEDBACKS + '.items.create', async (input, _meta, eventContext: MyEventContext) => {
    await assertGuestMayWrite(input, [], eventContext);
    return input;
  });

  filter(CollectionNames.FOODS_FEEDBACKS + '.items.update', async (input, meta, eventContext: MyEventContext) => {
    const keys = Array.isArray(meta?.keys) ? (meta.keys as PrimaryKey[]) : [];
    await assertGuestMayWrite(input, keys, eventContext);
    return input;
  });
});
