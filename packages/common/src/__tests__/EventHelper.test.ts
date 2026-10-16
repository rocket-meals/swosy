import {
  DatabaseTypes,
  doesAppVersionMatchConstraint,
  doesNewsMatchCanteen,
  filterNewsShownOutsideNewsList,
  getNewsCanteenIds,
  getNewsDisplayLocations,
  getNewsFoodoffersLocation,
  isNewsShownAt,
  isNewsShownInNewsList,
  isNewsVisibleAtTime,
  NewsDisplayLocations,
  NewsFoodoffersPositions,
} from 'repo-depkit-common';

describe('News display helper', () => {
  const baseNews = {
    id: '1',
    canteens: [],
    translations: [],
    display_locations: ['popup'],
    show_on_android: true,
    show_on_ios: true,
    show_on_web: true,
  } as unknown as DatabaseTypes.News;

  const referenceDate = new Date('2024-06-15T12:00:00Z');

  describe('display locations', () => {
    it('shows news without locations (e.g. imported ones) only in the news list', () => {
      expect(getNewsDisplayLocations({ display_locations: null })).toEqual([NewsDisplayLocations.news_list]);
      expect(getNewsDisplayLocations({ display_locations: [] })).toEqual([NewsDisplayLocations.news_list]);
      expect(getNewsDisplayLocations({ display_locations: ['something'] })).toEqual([NewsDisplayLocations.news_list]);
    });

    it('reads arrays and csv strings', () => {
      expect(getNewsDisplayLocations({ display_locations: ['news_list', 'popup'] })).toEqual(['news_list', 'popup']);
      expect(getNewsDisplayLocations({ display_locations: 'popup,foodoffers_top' })).toEqual(['popup', 'foodoffers_top']);
    });

    it('checks single locations and maps the food offers positions', () => {
      const news = { display_locations: ['news_list', 'foodoffers_bottom'] };
      expect(isNewsShownAt(news, NewsDisplayLocations.news_list)).toBe(true);
      expect(isNewsShownAt(news, NewsDisplayLocations.popup)).toBe(false);
      expect(isNewsShownAt(news, getNewsFoodoffersLocation(NewsFoodoffersPositions.bottom))).toBe(true);
      expect(isNewsShownAt(news, getNewsFoodoffersLocation(NewsFoodoffersPositions.top))).toBe(false);
    });
  });

  describe('time range', () => {
    it('is visible from date until date_end', () => {
      expect(isNewsVisibleAtTime({ date: null, date_end: null }, referenceDate)).toBe(true);
      expect(isNewsVisibleAtTime({ date: '2024-06-10T00:00:00Z', date_end: '2024-06-20T00:00:00Z' }, referenceDate)).toBe(true);
      expect(isNewsVisibleAtTime({ date: '2024-06-16T00:00:00Z', date_end: null }, referenceDate)).toBe(false);
      expect(isNewsVisibleAtTime({ date: null, date_end: '2024-06-10T00:00:00Z' }, referenceDate)).toBe(false);
    });

    it('can ignore the start, as the news list does', () => {
      expect(isNewsVisibleAtTime({ date: '2024-06-16T00:00:00Z', date_end: null }, referenceDate, true)).toBe(true);
    });

    it('lists news in the news list until their end', () => {
      expect(isNewsShownInNewsList({ display_locations: null, date: '2024-07-01T00:00:00Z', date_end: null }, referenceDate)).toBe(true);
      expect(isNewsShownInNewsList({ display_locations: null, date: null, date_end: '2024-06-10T00:00:00Z' }, referenceDate)).toBe(false);
      expect(isNewsShownInNewsList({ display_locations: ['popup'], date: null, date_end: null }, referenceDate)).toBe(false);
    });
  });

  describe('filterNewsShownOutsideNewsList', () => {
    it('keeps popup and food offers news in their time on the platform', () => {
      const newsList = [
        { ...baseNews, id: 'popup', date: '2024-06-10T00:00:00Z', date_end: '2024-06-20T00:00:00Z' },
        { ...baseNews, id: 'card', display_locations: ['foodoffers_top'] },
        { ...baseNews, id: 'list-only', display_locations: ['news_list'] },
        { ...baseNews, id: 'imported', display_locations: null },
        { ...baseNews, id: 'not-on-android', show_on_android: false },
        { ...baseNews, id: 'no-platform-value', show_on_android: null },
        { ...baseNews, id: 'ended', date_end: '2024-06-10T00:00:00Z' },
        { ...baseNews, id: 'future', date: '2024-07-01T00:00:00Z' },
      ] as DatabaseTypes.News[];

      const filtered = filterNewsShownOutsideNewsList(newsList, 'show_on_android', referenceDate);

      expect(filtered.map((news) => news.id)).toEqual(['popup', 'card', 'no-platform-value']);
    });

    it('shows news restricted to anonymous users only to anonymous users', () => {
      const newsList = [
        { ...baseNews, id: 'everyone' },
        { ...baseNews, id: 'anonymous-only', show_only_anonymous_users: true },
      ] as DatabaseTypes.News[];

      expect(filterNewsShownOutsideNewsList(newsList, 'show_on_web', referenceDate, undefined, true).map((news) => news.id)).toEqual(['everyone', 'anonymous-only']);
      expect(filterNewsShownOutsideNewsList(newsList, 'show_on_web', referenceDate, undefined, false).map((news) => news.id)).toEqual(['everyone']);
    });

    it('checks the app version constraint', () => {
      const newsList = [{ ...baseNews, id: 'old-versions', show_on_app_version: '<20.200.0' }] as DatabaseTypes.News[];
      expect(filterNewsShownOutsideNewsList(newsList, 'show_on_web', referenceDate, '20.199.0')).toHaveLength(1);
      expect(filterNewsShownOutsideNewsList(newsList, 'show_on_web', referenceDate, '20.200.0')).toHaveLength(0);
    });
  });

  describe('canteens', () => {
    it('matches every canteen when no canteen is set', () => {
      expect(doesNewsMatchCanteen(baseNews, 'a')).toBe(true);
      expect(doesNewsMatchCanteen(baseNews, null)).toBe(true);
      expect(doesNewsMatchCanteen({ canteens: undefined as unknown as [] }, 'a')).toBe(true);
    });

    it('matches only the listed canteens, as ids or resolved objects', () => {
      const withIds = { canteens: [{ id: 1, canteens_id: 'a' }] } as unknown as DatabaseTypes.News;
      const withObjects = { canteens: [{ id: 1, canteens_id: { id: 'b' } }] } as unknown as DatabaseTypes.News;

      expect(getNewsCanteenIds(withIds)).toEqual(['a']);
      expect(getNewsCanteenIds(withObjects)).toEqual(['b']);
      expect(doesNewsMatchCanteen(withIds, 'a')).toBe(true);
      expect(doesNewsMatchCanteen(withIds, 'b')).toBe(false);
      expect(doesNewsMatchCanteen(withObjects, 'b')).toBe(true);
      expect(doesNewsMatchCanteen(withObjects, undefined)).toBe(false);
    });
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
  });
});
