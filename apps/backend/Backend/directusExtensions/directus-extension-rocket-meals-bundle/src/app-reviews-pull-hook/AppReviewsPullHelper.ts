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

export class AppReviewsPullHelper {
  private readonly logger: { info: (msg: string) => void; error: (msg: string) => void };

  constructor(logger: { info: (msg: string) => void; error: (msg: string) => void }) {
    this.logger = logger;
  }

  async pullAppleReviews(appleAppId: string): Promise<PulledAppReview[]> {
    this.logger.info('app-reviews-pull-hook: Pulling Apple reviews for app ID: ' + appleAppId);

    const reviews: PulledAppReview[] = [];
    let page = 1;

    while (true) {
      const rssFeed = await AppleAppStoreRssHelper.fetchReviews(appleAppId, page);
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

    this.logger.info('app-reviews-pull-hook: Fetched ' + reviews.length + ' Apple reviews for app ID: ' + appleAppId);
    return reviews;
  }

  async pullGoogleReviews(googlePlayPackageName: string): Promise<PulledAppReview[]> {
    this.logger.info('app-reviews-pull-hook: Google Play review pull not yet implemented for package: ' + googlePlayPackageName);
    // Google Play reviews require the Google Play Developer API (OAuth2).
    // Implement via GooglePlayHelper once credentials are available.
    return [];
  }
}
