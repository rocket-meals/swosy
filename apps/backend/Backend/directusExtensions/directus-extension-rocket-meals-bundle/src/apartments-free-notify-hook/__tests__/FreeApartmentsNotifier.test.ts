import { describe, expect, it } from '@jest/globals';
import { FreeApartmentsNotifier } from '../FreeApartmentsNotifier';
import { MyDatabaseHelper } from '../../helpers/MyDatabaseHelper';
import { BackendTranslator } from '../../helpers/translations';

const german = { translate: BackendTranslator.getTranslator('de') };

describe('FreeApartmentsNotifier.getNewlyFreeApartmentIds', () => {
  it('finds apartments that get a date for the first time', () => {
    const rows = [
      { id: 'a', available_from: null },
      { id: 'b', available_from: '' },
    ];
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, { available_from: '2026-11-01' })).toEqual(['a', 'b']);
  });

  it('finds apartments whose date changes', () => {
    const rows = [{ id: 'a', available_from: '2026-10-01' }];
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, { available_from: '2026-11-01' })).toEqual(['a']);
  });

  it('does not notify again when the daily sync writes the same date', () => {
    const rows = [{ id: 'a', available_from: '2026-11-01T00:00:00.000Z' }];
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, { available_from: '2026-11-01T00:00:00Z' })).toEqual([]);
  });

  it('ignores updates that clear the date or do not touch it', () => {
    const rows = [{ id: 'a', available_from: null }];
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, { available_from: null })).toEqual([]);
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, { family_friendly: true })).toEqual([]);
    expect(FreeApartmentsNotifier.getNewlyFreeApartmentIds(rows, undefined)).toEqual([]);
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

describe('FreeApartmentsNotifier.notifyAboutApartments', () => {
  function createNotifier(options: { apartments: any[]; profiles: any[]; devicesByProfile: Record<string, any[]> }) {
    const created: any[] = [];
    const helper = {
      getApartmentsHelper: () => ({
        readByQuery: async (query: any) => options.apartments.filter(apartment => query.filter.id._in.includes(apartment.id)),
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
      getItemsServiceHelper: () => ({ readByQuery: async () => [] }),
    } as unknown as MyDatabaseHelper;
    return { notifier: new FreeApartmentsNotifier(helper), created };
  }

  const device = (token: string) => ({ id: 'device-' + token, pushTokenObj: { pushtokenObj: { data: token } } });

  it('notifies every profile that wants it, once, about all free apartments', async () => {
    const { notifier, created } = createNotifier({
      apartments: [
        { id: 'a', available_from: '2026-11-01', building: { alias: 'Haus A' } },
        { id: 'b', available_from: '2026-11-01', building: { alias: 'Haus B' } },
      ],
      profiles: [
        { id: 'p1', notifiy_on_free_apartments: true },
        { id: 'p2', notifiy_on_free_apartments: false },
        { id: 'p3', notifiy_on_free_apartments: true },
      ],
      devicesByProfile: { p1: [device('ExponentPushToken[p1]')], p2: [device('ExponentPushToken[p2]')], p3: [] },
    });

    await expect(notifier.notifyAboutApartments(['a', 'b'])).resolves.toBe(1);
    expect(created).toEqual([
      {
        expo_push_tokens: ['ExponentPushToken[p1]'],
        message_title: 'Freie Zimmer',
        message_body: 'In 2 Wohnungen sind jetzt Zimmer frei.',
      },
    ]);
  });

  it('sends nothing when the apartment is no longer free', async () => {
    const { notifier, created } = createNotifier({
      apartments: [{ id: 'a', available_from: null, building: { alias: 'Haus A' } }],
      profiles: [{ id: 'p1', notifiy_on_free_apartments: true }],
      devicesByProfile: { p1: [device('ExponentPushToken[p1]')] },
    });

    await expect(notifier.notifyAboutApartments(['a'])).resolves.toBe(0);
    expect(created).toEqual([]);
  });
});
