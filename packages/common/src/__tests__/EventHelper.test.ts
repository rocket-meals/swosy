import {
  DatabaseTypes,
  doesAppVersionMatchConstraint,
  doesPopupEventMatchCanteen,
  filterPopupEvents,
  getPopupEventCanteenIds,
  getPopupEventDisplayMode,
  getPopupEventFoodoffersPosition,
  isPopupEventActive,
  isPopupEventShownAsPopup,
  isPopupEventShownInFoodoffers,
  PopupEventDisplayModes,
  PopupEventFoodoffersPositions,
} from 'repo-depkit-common';

describe('Popup event helper', () => {
  const baseEvent: DatabaseTypes.PopupEvents = {
    id: '1',
    show_on_android: true,
    show_on_ios: true,
    show_on_web: true,
  } as DatabaseTypes.PopupEvents;

  const referenceDate = new Date('2024-06-15T12:00:00Z');

  it('treats events without date limits as active', () => {
    expect(isPopupEventActive(baseEvent, referenceDate)).toBe(true);
  });

  it('checks both start and end dates when provided', () => {
    const activeEvent = {
      ...baseEvent,
      date_start: '2024-06-10T00:00:00Z',
      date_end: '2024-06-20T23:59:59Z',
    } as DatabaseTypes.PopupEvents;

    const expiredEvent = {
      ...baseEvent,
      date_start: '2024-06-01T00:00:00Z',
      date_end: '2024-06-10T00:00:00Z',
    } as DatabaseTypes.PopupEvents;

    expect(isPopupEventActive(activeEvent, referenceDate)).toBe(true);
    expect(isPopupEventActive(expiredEvent, referenceDate)).toBe(false);
  });

  it('considers end date when no start date is provided', () => {
    const eventEndingInFuture = {
      ...baseEvent,
      date_end: '2024-06-20T00:00:00Z',
    } as DatabaseTypes.PopupEvents;

    const eventAlreadyEnded = {
      ...baseEvent,
      date_end: '2024-06-10T00:00:00Z',
    } as DatabaseTypes.PopupEvents;

    expect(isPopupEventActive(eventEndingInFuture, referenceDate)).toBe(true);
    expect(isPopupEventActive(eventAlreadyEnded, referenceDate)).toBe(false);
  });

  it('filters events by platform visibility and active dates', () => {
    const events: DatabaseTypes.PopupEvents[] = [
      {
        ...baseEvent,
        id: '1',
        date_start: '2024-06-10T00:00:00Z',
        date_end: '2024-06-20T23:59:59Z',
        show_on_android: true,
      },
      {
        ...baseEvent,
        id: '2',
        date_start: '2024-06-10T00:00:00Z',
        date_end: '2024-06-20T23:59:59Z',
        show_on_android: false,
      },
      {
        ...baseEvent,
        id: '3',
        date_end: '2024-06-10T00:00:00Z',
        show_on_android: true,
      },
    ];

    const filtered = filterPopupEvents(events, 'show_on_android', referenceDate);

    expect(filtered.map((event) => event.id)).toEqual(['1']);
  });

  it('shows events restricted to anonymous users only to anonymous users', () => {
    const events: DatabaseTypes.PopupEvents[] = [
      { ...baseEvent, id: 'everyone' },
      { ...baseEvent, id: 'anonymous-only', show_only_anonymous_users: true },
      { ...baseEvent, id: 'explicitly-everyone', show_only_anonymous_users: false },
    ];

    const forAnonymousUser = filterPopupEvents(events, 'show_on_web', referenceDate, undefined, true);
    const forUserWithAccount = filterPopupEvents(events, 'show_on_web', referenceDate, undefined, false);
    const withoutUserInformation = filterPopupEvents(events, 'show_on_web', referenceDate);

    expect(forAnonymousUser.map((event) => event.id)).toEqual(['everyone', 'anonymous-only', 'explicitly-everyone']);
    expect(forUserWithAccount.map((event) => event.id)).toEqual(['everyone', 'explicitly-everyone']);
    expect(withoutUserInformation.map((event) => event.id)).toEqual(['everyone', 'explicitly-everyone']);
  });

  describe('doesAppVersionMatchConstraint', () => {
    it('shows the event on every version when no constraint is set', () => {
      expect(doesAppVersionMatchConstraint(null, '20.200.0')).toBe(true);
      expect(doesAppVersionMatchConstraint(undefined, '20.200.0')).toBe(true);
      expect(doesAppVersionMatchConstraint('   ', '20.200.0')).toBe(true);
    });

    it('fails open when the current app version is unknown', () => {
      expect(doesAppVersionMatchConstraint('<20.200.0', undefined)).toBe(true);
    });

    it('fails open when the constraint cannot be parsed', () => {
      expect(doesAppVersionMatchConstraint('not-a-version', '20.200.0')).toBe(true);
    });

    it('only shows the event on older versions for a "<" constraint', () => {
      expect(doesAppVersionMatchConstraint('<20.200.0', '19.999.9')).toBe(true);
      expect(doesAppVersionMatchConstraint('<20.200.0', '20.199.9')).toBe(true);
      expect(doesAppVersionMatchConstraint('<20.200.0', '20.200.0')).toBe(false);
      expect(doesAppVersionMatchConstraint('<20.200.0', '20.200.1')).toBe(false);
      expect(doesAppVersionMatchConstraint('<20.200.0', '21.0.0')).toBe(false);
    });

    it('supports <=, >, >= and exact match constraints', () => {
      expect(doesAppVersionMatchConstraint('<=20.200.0', '20.200.0')).toBe(true);
      expect(doesAppVersionMatchConstraint('<=20.200.0', '20.200.1')).toBe(false);

      expect(doesAppVersionMatchConstraint('>20.200.0', '20.200.1')).toBe(true);
      expect(doesAppVersionMatchConstraint('>20.200.0', '20.200.0')).toBe(false);

      expect(doesAppVersionMatchConstraint('>=20.200.0', '20.200.0')).toBe(true);
      expect(doesAppVersionMatchConstraint('>=20.200.0', '20.199.9')).toBe(false);

      expect(doesAppVersionMatchConstraint('20.200.0', '20.200.0')).toBe(true);
      expect(doesAppVersionMatchConstraint('20.200.0', '20.200.1')).toBe(false);
    });

    it('excludes an event from the filtered results once the app is updated past the constraint', () => {
      const event: DatabaseTypes.PopupEvents = {
        ...baseEvent,
        id: '4',
        show_on_app_version: '<20.200.0',
      };

      expect(filterPopupEvents([event], 'show_on_android', referenceDate, '19.999.9').map((e) => e.id)).toEqual(['4']);
      expect(filterPopupEvents([event], 'show_on_android', referenceDate, '20.200.0').map((e) => e.id)).toEqual([]);
    });
  });
});

describe('Popup event display mode and canteens', () => {
  const event = { id: '1', canteens: [] } as unknown as DatabaseTypes.PopupEvents;

  it('shows events without a display mode as popup', () => {
    expect(getPopupEventDisplayMode(event)).toBe(PopupEventDisplayModes.popup);
    expect(isPopupEventShownAsPopup(event)).toBe(true);
    expect(isPopupEventShownInFoodoffers(event)).toBe(false);
  });

  it('shows unknown display modes as popup', () => {
    expect(getPopupEventDisplayMode({ display_mode: 'something' })).toBe(PopupEventDisplayModes.popup);
  });

  it('shows foodoffers events at their position in the food offers', () => {
    const topEvent = { ...event, display_mode: 'foodoffers_top' };
    const bottomEvent = { ...event, display_mode: 'foodoffers_bottom' };

    expect(isPopupEventShownAsPopup(topEvent)).toBe(false);
    expect(getPopupEventFoodoffersPosition(topEvent)).toBe(PopupEventFoodoffersPositions.top);
    expect(getPopupEventFoodoffersPosition(bottomEvent)).toBe(PopupEventFoodoffersPositions.bottom);
    expect(getPopupEventFoodoffersPosition(event)).toBeNull();
    expect(isPopupEventShownInFoodoffers(topEvent)).toBe(true);
    expect(isPopupEventShownInFoodoffers(topEvent, PopupEventFoodoffersPositions.top)).toBe(true);
    expect(isPopupEventShownInFoodoffers(topEvent, PopupEventFoodoffersPositions.bottom)).toBe(false);
    expect(isPopupEventShownInFoodoffers(bottomEvent, PopupEventFoodoffersPositions.bottom)).toBe(true);
  });

  it('matches every canteen when no canteen is set', () => {
    expect(doesPopupEventMatchCanteen(event, 'a')).toBe(true);
    expect(doesPopupEventMatchCanteen(event, null)).toBe(true);
    expect(doesPopupEventMatchCanteen({ canteens: undefined as unknown as [] }, 'a')).toBe(true);
  });

  it('matches only the listed canteens, as ids or resolved objects', () => {
    const withIds = { canteens: [{ id: 1, canteens_id: 'a' }] } as unknown as DatabaseTypes.PopupEvents;
    const withObjects = { canteens: [{ id: 1, canteens_id: { id: 'b' } }] } as unknown as DatabaseTypes.PopupEvents;

    expect(getPopupEventCanteenIds(withIds)).toEqual(['a']);
    expect(getPopupEventCanteenIds(withObjects)).toEqual(['b']);
    expect(doesPopupEventMatchCanteen(withIds, 'a')).toBe(true);
    expect(doesPopupEventMatchCanteen(withIds, 'b')).toBe(false);
    expect(doesPopupEventMatchCanteen(withObjects, 'b')).toBe(true);
    expect(doesPopupEventMatchCanteen(withObjects, undefined)).toBe(false);
  });
});
