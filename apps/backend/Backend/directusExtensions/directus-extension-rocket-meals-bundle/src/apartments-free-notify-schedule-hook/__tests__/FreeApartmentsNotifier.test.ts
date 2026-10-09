import { describe, expect, it } from '@jest/globals';
import { FreeApartmentsNotifier } from '../FreeApartmentsNotifier';
import { MyDatabaseHelper } from '../../helpers/MyDatabaseHelper';
import { BackendTranslator } from '../../helpers/translations';

const german = { translate: BackendTranslator.getTranslator('de') };

describe('FreeApartmentsNotifier.needsNotification', () => {
  it('announces a free apartment that was never announced', () => {
    expect(FreeApartmentsNotifier.needsNotification({ available_from: '2026-11-01', available_from_notified: null })).toBe(true);
  });

  it('announces it again when the date changes', () => {
    expect(FreeApartmentsNotifier.needsNotification({ available_from: '2026-12-01', available_from_notified: '2026-11-01' })).toBe(true);
  });

  it('does not announce the same date twice, also in another format', () => {
    expect(FreeApartmentsNotifier.needsNotification({ available_from: '2026-11-01T00:00:00.000Z', available_from_notified: '2026-11-01T00:00:00Z' })).toBe(false);
  });

  it('never announces an apartment without date, it has no free room', () => {
    expect(FreeApartmentsNotifier.needsNotification({ available_from: null, available_from_notified: '2026-11-01' })).toBe(false);
    expect(FreeApartmentsNotifier.needsNotification({ available_from: null, available_from_notified: null })).toBe(false);
  });
});

describe('FreeApartmentsNotifier.buildBody', () => {
  it('names the building for one apartment', () => {
    expect(FreeApartmentsNotifier.buildBody(german, ['Wohnheim Am See'])).toBe('In „Wohnheim Am See“ sind jetzt Zimmer frei.');
  });

  it('counts several apartments', () => {
    expect(FreeApartmentsNotifier.buildBody(german, ['A', null, 'C'])).toBe('In 3 Wohnungen sind jetzt Zimmer frei.');
  });

  it('works without a name', () => {
    expect(FreeApartmentsNotifier.buildBody(german, [null])).toBe('Es sind jetzt Zimmer frei.');
  });
});

describe('FreeApartmentsNotifier.notify', () => {
  function createNotifier(options: { apartments: any[]; profiles: any[]; devicesByProfile: Record<string, any[]> }) {
    const created: any[] = [];
    const apartments = options.apartments.map(apartment => ({ ...apartment }));
    const helper = {
      getApartmentsHelper: () => ({
        readByQuery: async (query: any) => {
          expect(query.filter).toEqual({ available_from: { _nnull: true } });
          return apartments.filter(apartment => apartment.available_from !== null).map(apartment => ({ ...apartment }));
        },
        updateOne: async (id: string, update: any) => {
          Object.assign(apartments.find(apartment => apartment.id === id), update);
        },
      }),
      getProfilesHelper: () => ({
        readByQuery: async (query: any) => options.profiles.filter(profile => profile.notifiy_on_free_apartments === query.filter.notifiy_on_free_apartments._eq),
      }),
      getDevicesHelper: () => ({
        readManyByProfileId: async (profileId: string) => options.devicesByProfile[profileId] ?? [],
      }),
      getPushNotificationsHelper: () => ({
        createOne: async (item: any) => {
          created.push(item);
          return 'id';
        },
      }),
      // The language resolver reads the `languages` collection, empty here means German.
      getLanguagesHelper: () => ({ readByQuery: async () => [] }),
    } as unknown as MyDatabaseHelper;
    return { notifier: new FreeApartmentsNotifier(helper), created, apartments };
  }

  const device = (token: string) => ({ id: 'device-' + token, pushTokenObj: { pushtokenObj: { data: token } } });

  it('notifies every waiting profile once about all new free apartments and remembers the dates', async () => {
    const { notifier, created, apartments } = createNotifier({
      apartments: [
        { id: 'new', available_from: '2026-11-01', available_from_notified: null, building: { alias: 'Haus A' } },
        { id: 'changed', available_from: '2026-12-01', available_from_notified: '2026-11-01', building: { alias: 'Haus B' } },
        { id: 'known', available_from: '2026-11-01', available_from_notified: '2026-11-01', building: { alias: 'Haus C' } },
        { id: 'not-free', available_from: null, available_from_notified: '2026-10-01', building: { alias: 'Haus D' } },
      ],
      profiles: [
        { id: 'p1', notifiy_on_free_apartments: true },
        { id: 'p2', notifiy_on_free_apartments: false },
        { id: 'p3', notifiy_on_free_apartments: true },
      ],
      devicesByProfile: { p1: [device('ExponentPushToken[p1]')], p2: [device('ExponentPushToken[p2]')], p3: [] },
    });

    await expect(notifier.notify()).resolves.toEqual({ apartments: 2, profiles: 1, failedProfiles: 0 });
    expect(created).toEqual([
      {
        expo_push_tokens: ['ExponentPushToken[p1]'],
        message_title: 'Freie Zimmer',
        message_body: 'In 2 Wohnungen sind jetzt Zimmer frei.',
      },
    ]);
    expect(apartments.map(apartment => [apartment.id, apartment.available_from_notified])).toEqual([
      ['new', '2026-11-01'],
      ['changed', '2026-12-01'],
      ['known', '2026-11-01'],
      ['not-free', '2026-10-01'],
    ]);

    // The next evening there is nothing new.
    await expect(notifier.notify()).resolves.toEqual({ apartments: 0, profiles: 0, failedProfiles: 0 });
    expect(created).toHaveLength(1);
  });
});
