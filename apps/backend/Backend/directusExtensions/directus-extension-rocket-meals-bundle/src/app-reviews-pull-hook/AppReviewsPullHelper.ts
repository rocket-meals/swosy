import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreRssHelper } from '../helpers/AppleAppStoreRssHelper';

/**
 * Intermediate type returned by pull helpers.
 * Contains all relevant fields for a new app review plus an explicit
 * `external_identifier` (the ID from the originating store) so the caller
 * can perform duplicate checks before persisting.
 */
export type PulledAppReview = Partial<DatabaseTypes.AppFeedbacks> & {
  external_identifier: string;
  source_identifier: string;
};

/**
 * Extracts the Apple App Store app ID from a store URL.
 * Example: https://apps.apple.com/de/app/swosy/id6667117575 → "6667117575"
 */
function extractAppleAppId(storeUrl: string): string | null {
  const match = storeUrl.match(/\/id(\d+)/);
  return match ? match[1]! : null;
}

/**
 * Extracts the Google Play app package name from a store URL.
 * Example: https://play.google.com/store/apps/details?id=de.rocket_meals.swosy → "de.rocket_meals.swosy"
 */
function extractGooglePlayPackageName(storeUrl: string): string | null {
  const match = storeUrl.match(/[?&]id=([^&]+)/);
  return match ? match[1]! : null;
}

export class AppReviewsPullHelper {
  private readonly logger: { info: (msg: string) => void; error: (msg: string) => void };

  constructor(logger: { info: (msg: string) => void; error: (msg: string) => void }) {
    this.logger = logger;
  }

  async pullAppleReviews(appSettings: Partial<DatabaseTypes.AppSettings>): Promise<PulledAppReview[]> {
    const appleStoreUrl = appSettings.app_stores_url_to_apple;
    if (!appleStoreUrl) {
      this.logger.info('app-reviews-pull-hook: No Apple Store URL configured, skipping Apple reviews');
      return [];
    }

    const appId = extractAppleAppId(appleStoreUrl);
    if (!appId) {
      this.logger.info('app-reviews-pull-hook: Could not extract Apple app ID from URL: ' + appleStoreUrl);
      return [];
    }

    this.logger.info('app-reviews-pull-hook: Pulling Apple reviews for app ID: ' + appId);

    const reviews: PulledAppReview[] = [];
    let page = 1;

    while (true) {
      const rssFeed = await AppleAppStoreRssHelper.fetchReviews(appId, page);
      const entries = rssFeed.feed.entry;

      if (!entries || entries.length === 0) {
        break;
      }

      for (const entry of entries) {
        const reviewId = AppleAppStoreRssHelper.getReviewId(entry);
        const rating = AppleAppStoreRssHelper.getReviewRating(entry);
        const title = AppleAppStoreRssHelper.getReviewTitle(entry);
        const body = AppleAppStoreRssHelper.getReviewBody(entry);

        reviews.push({
          external_identifier: reviewId,
          source_identifier: AppFeedbackSourceIdentifier.APPLE,
          title: title,
          content: body,
          source_rating_raw: rating,
          positive: rating >= 4,
        });
      }

      if (entries.length < 50) {
        break;
      }

      page++;
    }

    this.logger.info('app-reviews-pull-hook: Fetched ' + reviews.length + ' Apple reviews');
    return reviews;
  }

  async pullGoogleReviews(appSettings: Partial<DatabaseTypes.AppSettings>): Promise<PulledAppReview[]> {
    const googleStoreUrl = appSettings.app_stores_url_to_google;
    if (!googleStoreUrl) {
      this.logger.info('app-reviews-pull-hook: No Google Play Store URL configured, skipping Google reviews');
      return [];
    }

    const packageName = extractGooglePlayPackageName(googleStoreUrl);
    if (!packageName) {
      this.logger.info('app-reviews-pull-hook: Could not extract Google Play package name from URL: ' + googleStoreUrl);
      return [];
    }

    this.logger.info('app-reviews-pull-hook: Google Play review pull not yet implemented for package: ' + packageName);
    // Google Play reviews require the Google Play Developer API (OAuth2).
    // Implement via GooglePlayHelper once credentials are available.
    return [];
  }
}
