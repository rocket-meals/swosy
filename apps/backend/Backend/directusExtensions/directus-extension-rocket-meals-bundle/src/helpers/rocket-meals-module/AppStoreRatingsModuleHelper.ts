/**
 * AppStoreRatingsModuleHelper.ts – data side of the store ratings next to the page "App-Feedbacks"
 * (`app-store-ratings.vue`): the current average and number of ratings in the Apple App Store and
 * in Google Play.
 *
 * Source: `GET /rocket-meals-app-store-ratings` (`app-store-ratings-endpoint`). The browser cannot ask
 * the stores itself – Google Play sends no CORS headers – so the server fetches and caches them.
 *
 * No Vue in here, so the rules are testable in Node.
 */

import { AppFeedbackSourceIdentifier } from 'repo-depkit-common/src/AppFeedbackSourceIdentifier';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

export type AppStoreRatingStore = AppFeedbackSourceIdentifier.APPLE | AppFeedbackSourceIdentifier.GOOGLE_PLAY;

/** One entry of `GET /rocket-meals-app-store-ratings`. */
export type AppStoreRating = {
  store: AppStoreRatingStore;
  /** Average stars (1–5), `null` while the app has no ratings or the store could not be read. */
  average: number | null;
  /** Number of star ratings (not only the written reviews). */
  count: number | null;
  /** The public store page of the app. */
  store_url: string | null;
  /** Why the store could not be read; `null` when it could. */
  error: string | null;
  /** ISO timestamp of the moment the server asked the store. */
  fetched_at: string;
};

export type AppStoreRatingsResponse = {
  data: AppStoreRating[];
};

/** The part of the Directus app's axios instance used here. */
export type AppStoreRatingsApiClient = {
  get: (url: string) => Promise<{ data?: any }>;
};

export class AppStoreRatingsModuleHelper {
  public static readonly ENDPOINT = '/rocket-meals-app-store-ratings';

  public static readonly MAX_STARS = 5;

  /** Only the stores configured for this customer are answered – an empty list hides the ratings. */
  static async load(api: AppStoreRatingsApiClient): Promise<AppStoreRating[]> {
    const response = await api.get(AppStoreRatingsModuleHelper.ENDPOINT);
    return ((response.data as AppStoreRatingsResponse | undefined)?.data ?? []) as AppStoreRating[];
  }

  static getStoreLabelKey(store: AppStoreRatingStore): BackendTranslationKeys {
    return store === AppFeedbackSourceIdentifier.APPLE ? BackendTranslationKeys.rocket_meals_module_source_apple : BackendTranslationKeys.rocket_meals_module_source_google_play;
  }

  static getStoreIcon(store: AppStoreRatingStore): string {
    return store === AppFeedbackSourceIdentifier.APPLE ? 'apple' : 'google_play';
  }

  /** Filled share (0–1) of each of the five stars, so 3.4 fills three stars and 40 % of the fourth. */
  static getStarFills(average: number | null | undefined): number[] {
    const value = typeof average === 'number' && Number.isFinite(average) ? average : 0;
    return Array.from({ length: AppStoreRatingsModuleHelper.MAX_STARS }, (_, index) => Math.min(1, Math.max(0, value - index)));
  }

  /** The average with one decimal in the language of the page, e.g. `3,4` in German. */
  static formatAverage(average: number, language: string | undefined): string {
    return new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(average);
  }

  static formatCount(count: number, language: string | undefined): string {
    return new Intl.NumberFormat(language).format(count);
  }
}
