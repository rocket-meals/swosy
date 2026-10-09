import { DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { PushNotificationHelper } from '../helpers/PushNotificationHelper';
import { BackendLanguageResolver, BackendTranslationKeys, ResolvedBackendLanguage } from '../helpers/translations';

/** `available_from_notified`: the `available_from` the profiles were last notified about. */
export type ApartmentForFreeNotification = Pick<DatabaseTypes.Apartments, 'id' | 'available_from'> & {
  available_from_notified?: string | null;
  building?: { alias?: string | null } | string | null;
};

export type FreeApartmentsNotificationResult = {
  apartments: number;
  profiles: number;
  failedProfiles: number;
};

/**
 * Push notification to every profile with `notifiy_on_free_apartments` about apartments with free
 * rooms they were not notified about yet. Runs as the daily workflow `apartments-free-notify`.
 *
 * `apartments.available_from_notified` remembers the date the profiles were notified about, so an
 * apartment is only announced again when it gets another `available_from`. An apartment without
 * `available_from` has no free room and is never announced.
 */
export class FreeApartmentsNotifier {
  constructor(private readonly myDatabaseHelper: MyDatabaseHelper) {}

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

  /** Free (`available_from` set) with another date than the one the profiles were notified about. */
  static needsNotification(apartment: Pick<ApartmentForFreeNotification, 'available_from' | 'available_from_notified'>): boolean {
    if (!FreeApartmentsNotifier.hasDate(apartment.available_from)) {
      return false;
    }
    if (!FreeApartmentsNotifier.hasDate(apartment.available_from_notified)) {
      return true;
    }
    return FreeApartmentsNotifier.toTime(apartment.available_from) !== FreeApartmentsNotifier.toTime(apartment.available_from_notified);
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

  async readApartmentsToNotify(): Promise<ApartmentForFreeNotification[]> {
    const apartments = (await this.myDatabaseHelper.getApartmentsHelper().readByQuery({
      filter: { available_from: { _nnull: true } } as any,
      fields: ['id', 'available_from', 'available_from_notified', 'building.alias'],
      limit: -1,
    })) as ApartmentForFreeNotification[];
    return apartments.filter(apartment => FreeApartmentsNotifier.needsNotification(apartment));
  }

  /**
   * Notifies every waiting profile once about all new free apartments, then remembers the dates.
   * A profile whose notification could not be created does not stop the others.
   */
  async notify(log: (message: string) => Promise<void> = async () => {}): Promise<FreeApartmentsNotificationResult> {
    const apartments = await this.readApartmentsToNotify();
    await log('Apartments with new free rooms: ' + apartments.length);
    if (apartments.length === 0) {
      return { apartments: 0, profiles: 0, failedProfiles: 0 };
    }
    const apartmentNames = apartments.map(apartment => (typeof apartment.building === 'object' ? apartment.building?.alias : null));

    const profiles = await this.myDatabaseHelper.getProfilesHelper().readByQuery({
      filter: { notifiy_on_free_apartments: { _eq: true } } as any,
      fields: ['id', 'language'],
      limit: -1,
    });
    await log('Profiles waiting for free apartments: ' + profiles.length);

    const languageResolver = new BackendLanguageResolver(this.myDatabaseHelper);
    let notifiedProfiles = 0;
    let failedProfiles = 0;
    for (const profile of profiles) {
      try {
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
        notifiedProfiles++;
      } catch (error) {
        failedProfiles++;
        await log('Could not notify profile ' + profile.id + ': ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    const apartmentsHelper = this.myDatabaseHelper.getApartmentsHelper();
    for (const apartment of apartments) {
      await apartmentsHelper.updateOne(apartment.id, { available_from_notified: apartment.available_from } as Partial<DatabaseTypes.Apartments>);
    }
    await log('Notified profiles: ' + notifiedProfiles + ', failed: ' + failedProfiles);
    return { apartments: apartments.length, profiles: notifiedProfiles, failedProfiles };
  }
}
