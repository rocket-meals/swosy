import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreRssHelper } from '../helpers/AppleAppStoreRssHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

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
  private readonly myDatabaseHelper: MyDatabaseHelper;
  private readonly logger: { info: (msg: string) => void; error: (msg: string) => void };

  constructor(myDatabaseHelper: MyDatabaseHelper, logger: { info: (msg: string) => void; error: (msg: string) => void }) {
    this.myDatabaseHelper = myDatabaseHelper;
    this.logger = logger;
  }

  async pullAppleReviews(appSettings: Partial<DatabaseTypes.AppSettings>): Promise<void> {
    const appleStoreUrl = appSettings.app_stores_url_to_apple;
    if (!appleStoreUrl) {
      this.logger.info('app-reviews-pull-hook: No Apple Store URL configured, skipping Apple reviews');
      return;
    }

    const appId = extractAppleAppId(appleStoreUrl);
    if (!appId) {
      this.logger.info('app-reviews-pull-hook: Could not extract Apple app ID from URL: ' + appleStoreUrl);
      return;
    }

    this.logger.info('app-reviews-pull-hook: Pulling Apple reviews for app ID: ' + appId);

    const appFeedbacksHelper = this.myDatabaseHelper.getAppFeedbacksHelper();

    let page = 1;
    let totalPulled = 0;

    while (true) {
      const rssFeed = await AppleAppStoreRssHelper.fetchReviews(appId, page);
      const entries = rssFeed.feed.entry;

      if (!entries || entries.length === 0) {
        break;
      }

      for (const entry of entries) {
        const reviewId = AppleAppStoreRssHelper.getReviewId(entry);

        const existing = await appFeedbacksHelper.readByQuery({
          filter: { id: { _eq: reviewId } },
          limit: 1,
        });

        if (existing && existing.length > 0) {
          continue;
        }

        const rating = AppleAppStoreRssHelper.getReviewRating(entry);
        const title = AppleAppStoreRssHelper.getReviewTitle(entry);
        const body = AppleAppStoreRssHelper.getReviewBody(entry);

        const newFeedback: Partial<DatabaseTypes.AppFeedbacks> = {
          id: reviewId,
          title: title,
          content: body,
          source_identifier: AppFeedbackSourceIdentifier.APPLE,
          source_rating_raw: rating,
          positive: rating >= 4,
        };

        await appFeedbacksHelper.createOne(newFeedback);
        totalPulled++;
      }

      if (entries.length < 50) {
        break;
      }

      page++;
    }

    this.logger.info('app-reviews-pull-hook: Pulled ' + totalPulled + ' new Apple reviews');
  }

  async pullGoogleReviews(appSettings: Partial<DatabaseTypes.AppSettings>): Promise<void> {
    const googleStoreUrl = appSettings.app_stores_url_to_google;
    if (!googleStoreUrl) {
      this.logger.info('app-reviews-pull-hook: No Google Play Store URL configured, skipping Google reviews');
      return;
    }

    const packageName = extractGooglePlayPackageName(googleStoreUrl);
    if (!packageName) {
      this.logger.info('app-reviews-pull-hook: Could not extract Google Play package name from URL: ' + googleStoreUrl);
      return;
    }

    this.logger.info('app-reviews-pull-hook: Google Play review pull not yet implemented for package: ' + packageName);
    // Google Play reviews require the Google Play Developer API (OAuth2).
    // Implement via GooglePlayHelper once credentials are available.
  }
}
