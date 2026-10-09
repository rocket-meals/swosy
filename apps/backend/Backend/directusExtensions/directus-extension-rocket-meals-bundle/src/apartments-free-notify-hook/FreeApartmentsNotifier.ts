import { PrimaryKey } from '@directus/types';
import { DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { PushNotificationHelper } from '../helpers/PushNotificationHelper';
import { BackendLanguageResolver, BackendTranslationKeys, ResolvedBackendLanguage } from '../helpers/translations';

type ApartmentAvailability = Pick<DatabaseTypes.Apartments, 'id' | 'available_from'>;

/**
 * Push notification to every profile with `notifiy_on_free_apartments` when apartments get free
 * rooms (`apartments.available_from`).
 */
export class FreeApartmentsNotifier {
  constructor(private readonly myDatabaseHelper: MyDatabaseHelper) {}

  /**
   * The apartments an update makes free: `available_from` gets a date it did not have before
   * (empty before, or another date). The housing sync writes every apartment every day, so an
   * unchanged date must not notify again, and clearing the date is no free room.
   */
  static getNewlyFreeApartmentIds(rowsBeforeUpdate: ApartmentAvailability[], payload: Partial<DatabaseTypes.Apartments> | null | undefined): string[] {
    if (!payload || !('available_from' in payload) || !FreeApartmentsNotifier.hasDate(payload.available_from)) {
      return [];
    }
    const newDate = FreeApartmentsNotifier.toTime(payload.available_from);
    return rowsBeforeUpdate.filter(row => !FreeApartmentsNotifier.hasDate(row.available_from) || FreeApartmentsNotifier.toTime(row.available_from) !== newDate).map(row => String(row.id));
  }

  static hasDate(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /** Compares dates, not strings: Directus may hand the same date back in another format. */
  private static toTime(value: string | null | undefined): number | string | null | undefined {
    if (!FreeApartmentsNotifier.hasDate(value)) {
      return value;
    }
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? value : time;
  }

  /** The text of the notification: the building's name for one apartment, the number for several. */
  static buildBody(language: Pick<ResolvedBackendLanguage, 'translate'>, apartmentNames: (string | null | undefined)[]): string {
    const names = apartmentNames.filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
    if (apartmentNames.length === 1 && names.length === 1) {
      return language.translate(BackendTranslationKeys.notification_free_apartments_body_single, { name: names[0]! });
    }
    if (apartmentNames.length > 1) {
      return language.translate(BackendTranslationKeys.notification_free_apartments_body_many, { count: String(apartmentNames.length) });
    }
    return language.translate(BackendTranslationKeys.notification_free_apartments_body_unnamed);
  }

  async readAvailability(keys: PrimaryKey[]): Promise<ApartmentAvailability[]> {
    if (keys.length === 0) {
      return [];
    }
    return (await this.myDatabaseHelper.getApartmentsHelper().readByQuery({
      filter: { id: { _in: keys } } as any,
      fields: ['id', 'available_from'],
      limit: -1,
    })) as ApartmentAvailability[];
  }

  /** Sends one notification per profile about all given apartments. Returns how many profiles got it. */
  async notifyAboutApartments(apartmentIds: string[]): Promise<number> {
    if (apartmentIds.length === 0) {
      return 0;
    }
    const apartments = (await this.myDatabaseHelper.getApartmentsHelper().readByQuery({
      filter: { id: { _in: apartmentIds } } as any,
      fields: ['id', 'available_from', 'building.alias'],
      limit: -1,
    })) as (DatabaseTypes.Apartments & { building?: { alias?: string | null } | string | null })[];
    // Only apartments that are still free when the notification goes out.
    const freeApartments = apartments.filter(apartment => FreeApartmentsNotifier.hasDate(apartment.available_from));
    if (freeApartments.length === 0) {
      return 0;
    }
    const apartmentNames = freeApartments.map(apartment => (typeof apartment.building === 'object' ? apartment.building?.alias : null));

    const profiles = await this.myDatabaseHelper.getProfilesHelper().readByQuery({
      filter: { notifiy_on_free_apartments: { _eq: true } } as any,
      fields: ['id', 'language'],
      limit: -1,
    });
    const languageResolver = new BackendLanguageResolver(this.myDatabaseHelper);
    let sent = 0;
    for (const profile of profiles) {
      const devices = await this.myDatabaseHelper.getDevicesHelper().readManyByProfileId(profile.id);
      const expoPushTokens = PushNotificationHelper.getExpoPushTokensFromDevices(devices);
      if (expoPushTokens.length === 0) {
        continue;
      }
      const language = await languageResolver.resolveForProfile(profile);
      await this.myDatabaseHelper.getPushNotificationsHelper().createOne({
        expo_push_tokens: expoPushTokens,
        message_title: language.translate(BackendTranslationKeys.notification_free_apartments_title),
        message_body: FreeApartmentsNotifier.buildBody(language, apartmentNames),
      });
      sent++;
    }
    return sent;
  }
}
