/**
 * AppStoreRatingsHelper.ts – reads the current star rating (average and number of ratings) of the
 * app in the Apple App Store and in Google Play, for `app-store-ratings-endpoint`.
 *
 * Neither store offers the overall rating through the APIs we already use for the reviews
 * (`AppleAppStoreConnectHelper`, `GooglePlayHelper`), so the public pages are read – no keys needed:
 * - Apple: the iTunes lookup (`averageUserRating`, `userRatingCount`). Apple keeps ratings per
 *   storefront, the German one (`APPLE_STOREFRONT`) is the one our users rate in.
 * - Google Play: the details page. It embeds the exact values in its inline data (`ds:5`); the
 *   rounded average from the star label is the fallback when that structure changes.
 *
 * The answers are cached for an hour (`AppStoreRatingsCache`), the ratings move slowly and every
 * opening of the page would otherwise ask both stores.
 */

import { AppFeedbackSourceIdentifier } from 'repo-depkit-common';
import type { AppStoreRating, AppStoreRatingStore } from './rocket-meals-module/AppStoreRatingsModuleHelper';

type ParsedRating = { average: number | null; count: number | null };

type StoreConfig = { store: AppStoreRatingStore; id: string };

class AppStoreRatingsCache {
  static readonly entries = new Map<string, { expiresAt: number; rating: Promise<AppStoreRating> }>();
}

export class AppStoreRatingsHelper {
  public static readonly APPLE_STOREFRONT = 'de';

  public static readonly CACHE_DURATION_MS = 60 * 60 * 1000;

  /** A store that could not be read is asked again sooner. */
  public static readonly ERROR_CACHE_DURATION_MS = 5 * 60 * 1000;

  private static readonly REQUEST_TIMEOUT_MS = 10 * 1000;

  static getAppleLookupUrl(appleAppId: string): string {
    return `https://itunes.apple.com/lookup?id=${encodeURIComponent(appleAppId)}&country=${AppStoreRatingsHelper.APPLE_STOREFRONT}`;
  }

  static getAppleStoreUrl(appleAppId: string): string {
    return `https://apps.apple.com/${AppStoreRatingsHelper.APPLE_STOREFRONT}/app/id${encodeURIComponent(appleAppId)}`;
  }

  static getGooglePlayUrl(packageName: string): string {
    return `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=DE`;
  }

  /** `found: false` when the app is not listed in the storefront; an app without ratings is found with `count: 0` or `null`. */
  static parseAppleLookup(json: unknown): ParsedRating & { found: boolean; storeUrl: string | null } {
    const results = (json as { results?: unknown } | null)?.results;
    const first = (Array.isArray(results) ? results[0] : undefined) as { averageUserRating?: unknown; userRatingCount?: unknown; trackViewUrl?: unknown } | undefined;
    return {
      found: first !== undefined && first !== null,
      average: AppStoreRatingsHelper.toRatingOrNull(first?.averageUserRating),
      count: AppStoreRatingsHelper.toCountOrNull(first?.userRatingCount),
      storeUrl: typeof first?.trackViewUrl === 'string' ? first.trackViewUrl : null,
    };
  }

  /**
   * Google Play has no public API for the rating. The details page loads its data with
   * `AF_initDataCallback({key: 'ds:5', ..., data: [...]})`; in there `[1][2][51]` holds
   * `[["3.1", 3.11], [histogram], ["57", 57], ["23", 23], ...]` – average, histogram, ratings, reviews.
   */
  static parseGooglePlayHtml(html: string): ParsedRating {
    const fromData = AppStoreRatingsHelper.parseGooglePlayInitData(html);
    if (fromData) {
      return fromData;
    }
    const label = /aria-label="Rated (\d+(?:\.\d+)?) stars out of five stars"/.exec(html);
    return { average: AppStoreRatingsHelper.toRatingOrNull(Number.parseFloat(label?.[1] ?? '')), count: null };
  }

  private static parseGooglePlayInitData(html: string): ParsedRating | null {
    const match = /AF_initDataCallback\(\{key: 'ds:5',[^{]*?data:([\s\S]*?), sideChannel: \{\}\}\);<\/script>/.exec(html);
    if (!match?.[1]) {
      return null;
    }
    try {
      const data = JSON.parse(match[1]) as any;
      const rating = data?.[1]?.[2]?.[51];
      if (!Array.isArray(rating)) {
        return null;
      }
      return { average: AppStoreRatingsHelper.toRatingOrNull(rating[0]?.[1]), count: AppStoreRatingsHelper.toCountOrNull(rating[2]?.[1]) };
    } catch {
      return null;
    }
  }

  /** The stores configured for this customer, Apple first – the order the page shows them in. */
  static getConfiguredStores(appleAppId: string | null | undefined, googlePlayPackageName: string | null | undefined): StoreConfig[] {
    return [...(appleAppId ? [{ store: AppFeedbackSourceIdentifier.APPLE as AppStoreRatingStore, id: appleAppId }] : []), ...(googlePlayPackageName ? [{ store: AppFeedbackSourceIdentifier.GOOGLE_PLAY as AppStoreRatingStore, id: googlePlayPackageName }] : [])];
  }

  static async getRatings(appleAppId: string | null | undefined, googlePlayPackageName: string | null | undefined, now: number = Date.now()): Promise<AppStoreRating[]> {
    const stores = AppStoreRatingsHelper.getConfiguredStores(appleAppId, googlePlayPackageName);
    return Promise.all(stores.map(config => AppStoreRatingsHelper.getCachedRating(config, now)));
  }

  private static getCachedRating(config: StoreConfig, now: number): Promise<AppStoreRating> {
    const key = `${config.store}:${config.id}`;
    const cached = AppStoreRatingsCache.entries.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.rating;
    }
    // The promise is cached right away, so pages opened at the same time share one request.
    const rating = AppStoreRatingsHelper.fetchRating(config).then(result => {
      const duration = result.error ? AppStoreRatingsHelper.ERROR_CACHE_DURATION_MS : AppStoreRatingsHelper.CACHE_DURATION_MS;
      AppStoreRatingsCache.entries.set(key, { expiresAt: now + duration, rating: Promise.resolve(result) });
      return result;
    });
    AppStoreRatingsCache.entries.set(key, { expiresAt: now + AppStoreRatingsHelper.CACHE_DURATION_MS, rating });
    return rating;
  }

  static clearCache(): void {
    AppStoreRatingsCache.entries.clear();
  }

  private static async fetchRating(config: StoreConfig): Promise<AppStoreRating> {
    const fetchedAt = new Date().toISOString();
    const fallbackUrl = config.store === AppFeedbackSourceIdentifier.APPLE ? AppStoreRatingsHelper.getAppleStoreUrl(config.id) : AppStoreRatingsHelper.getGooglePlayUrl(config.id);
    try {
      if (config.store === AppFeedbackSourceIdentifier.APPLE) {
        const response = await fetch(AppStoreRatingsHelper.getAppleLookupUrl(config.id), { signal: AbortSignal.timeout(AppStoreRatingsHelper.REQUEST_TIMEOUT_MS) });
        if (!response.ok) {
          return { store: config.store, average: null, count: null, store_url: fallbackUrl, error: `HTTP ${response.status}`, fetched_at: fetchedAt };
        }
        const parsed = AppStoreRatingsHelper.parseAppleLookup(await response.json());
        return { store: config.store, average: parsed.average, count: parsed.count, store_url: parsed.storeUrl ?? fallbackUrl, error: parsed.found ? null : 'App not found in the App Store', fetched_at: fetchedAt };
      }
      const response = await fetch(fallbackUrl, { signal: AbortSignal.timeout(AppStoreRatingsHelper.REQUEST_TIMEOUT_MS) });
      if (!response.ok) {
        return { store: config.store, average: null, count: null, store_url: fallbackUrl, error: `HTTP ${response.status}`, fetched_at: fetchedAt };
      }
      const parsed = AppStoreRatingsHelper.parseGooglePlayHtml(await response.text());
      return { store: config.store, average: parsed.average, count: parsed.count, store_url: fallbackUrl, error: parsed.average === null && parsed.count === null ? 'Rating not found on the Google Play page' : null, fetched_at: fetchedAt };
    } catch (error) {
      return { store: config.store, average: null, count: null, store_url: fallbackUrl, error: error instanceof Error ? error.message : String(error), fetched_at: fetchedAt };
    }
  }

  /** A store sends 0 as average while nobody rated – that is "no rating", not zero stars. */
  private static toRatingOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  }

  private static toCountOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }
}
