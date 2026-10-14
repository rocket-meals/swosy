import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { AppFeedbackSourceIdentifier } from 'repo-depkit-common';
import { AppStoreRatingsHelper } from '../AppStoreRatingsHelper';
import { AppStoreRatingsModuleHelper } from '../rocket-meals-module/AppStoreRatingsModuleHelper';

/** Shortened from the real details page: `ds:5` with the rating at `[1][2][51]`, next to other inline data. */
function buildGooglePlayHtml(rating: unknown): string {
  const app: unknown[] = [['SWOSY']];
  app[51] = rating;
  const ds5 = JSON.stringify([[[[]]], [null, null, app]]);
  return [`<script nonce="x">AF_initDataCallback({key: 'ds:2', hash: '1', data:[0], sideChannel: {}});</script>`, `<script nonce="x">AF_initDataCallback({key: 'ds:5', hash: '11', data:${ds5}, sideChannel: {}});</script>`, `<div itemprop="starRating"><div aria-label="Rated 3.1 stars out of five stars">3.1</div></div>`].join('');
}

describe('AppStoreRatingsHelper', () => {
  afterEach(() => {
    AppStoreRatingsHelper.clearCache();
    jest.restoreAllMocks();
  });

  describe('parseAppleLookup', () => {
    it('reads the average and number of ratings of the storefront', () => {
      const parsed = AppStoreRatingsHelper.parseAppleLookup({ resultCount: 1, results: [{ averageUserRating: 3.44737, userRatingCount: 76, trackViewUrl: 'https://apps.apple.com/de/app/swosy/id6667117575?uo=4' }] });
      expect(parsed).toEqual({ found: true, average: 3.44737, count: 76, storeUrl: 'https://apps.apple.com/de/app/swosy/id6667117575?uo=4' });
    });

    it('tells an app without ratings from an app that is not listed', () => {
      expect(AppStoreRatingsHelper.parseAppleLookup({ resultCount: 1, results: [{ averageUserRating: 0, userRatingCount: 0 }] })).toEqual({ found: true, average: null, count: 0, storeUrl: null });
      expect(AppStoreRatingsHelper.parseAppleLookup({ resultCount: 0, results: [] }).found).toBe(false);
      expect(AppStoreRatingsHelper.parseAppleLookup(null).found).toBe(false);
    });
  });

  describe('parseGooglePlayHtml', () => {
    it('reads the exact average and number of ratings from the inline data', () => {
      const html = buildGooglePlayHtml([['3.1', 3.1153846], [null, ['19', 19], ['7', 7], ['1', 1], ['3', 3], ['25', 25]], ['57', 57], ['23', 23], null, [null, []]]);
      expect(AppStoreRatingsHelper.parseGooglePlayHtml(html)).toEqual({ average: 3.1153846, count: 57 });
    });

    it('falls back to the rounded average of the star label when the inline data changed', () => {
      expect(AppStoreRatingsHelper.parseGooglePlayHtml(buildGooglePlayHtml('changed'))).toEqual({ average: 3.1, count: null });
      expect(AppStoreRatingsHelper.parseGooglePlayHtml('<html></html>')).toEqual({ average: null, count: null });
    });
  });

  describe('getConfiguredStores', () => {
    it('lists only the stores of this customer, Apple first', () => {
      expect(AppStoreRatingsHelper.getConfiguredStores('123', 'de.example.app').map(store => store.store)).toEqual([AppFeedbackSourceIdentifier.APPLE, AppFeedbackSourceIdentifier.GOOGLE_PLAY]);
      expect(AppStoreRatingsHelper.getConfiguredStores(null, 'de.example.app').map(store => store.store)).toEqual([AppFeedbackSourceIdentifier.GOOGLE_PLAY]);
      expect(AppStoreRatingsHelper.getConfiguredStores(undefined, null)).toEqual([]);
    });
  });

  describe('getRatings', () => {
    it('asks a store once per hour and reports a failed store instead of throwing', async () => {
      const fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(async input => {
        if (String(input).includes('itunes.apple.com')) {
          return new Response(JSON.stringify({ results: [{ averageUserRating: 4.5, userRatingCount: 10, trackViewUrl: 'https://apps.apple.com/de/app/id1' }] }));
        }
        return new Response('', { status: 503 });
      });

      const now = Date.now();
      const first = await AppStoreRatingsHelper.getRatings('1', 'de.example.app', now);
      expect(first.map(({ fetched_at, ...rating }) => rating)).toEqual([
        { store: AppFeedbackSourceIdentifier.APPLE, average: 4.5, count: 10, store_url: 'https://apps.apple.com/de/app/id1', error: null },
        { store: AppFeedbackSourceIdentifier.GOOGLE_PLAY, average: null, count: null, store_url: AppStoreRatingsHelper.getGooglePlayUrl('de.example.app'), error: 'HTTP 503' },
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Ten minutes later: Apple still from the cache, the failed Google Play is asked again.
      await AppStoreRatingsHelper.getRatings('1', 'de.example.app', now + 10 * 60 * 1000);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});

describe('AppStoreRatingsModuleHelper', () => {
  it('fills the stars up to the average', () => {
    expect(AppStoreRatingsModuleHelper.getStarFills(3.4).map(fill => Math.round(fill * 10) / 10)).toEqual([1, 1, 1, 0.4, 0]);
    expect(AppStoreRatingsModuleHelper.getStarFills(null)).toEqual([0, 0, 0, 0, 0]);
    expect(AppStoreRatingsModuleHelper.getStarFills(5)).toEqual([1, 1, 1, 1, 1]);
  });

  it('formats the average with one decimal in the page language', () => {
    expect(AppStoreRatingsModuleHelper.formatAverage(3.44737, 'de')).toBe('3,4');
    expect(AppStoreRatingsModuleHelper.formatAverage(4, 'en')).toBe('4.0');
    expect(AppStoreRatingsModuleHelper.formatCount(1234, 'de')).toBe('1.234');
  });
});
