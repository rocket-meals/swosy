import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreConnectHelper } from '../helpers/AppleAppStoreConnectHelper';
import { GooglePlayHelper } from '../helpers/GooglePlayHelper';

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

  /**
   * Pull Apple reviews using the App Store Connect API.
   * Requires a valid private key for authentication.
   */
  async pullAppleReviews(appleAppId: string, privateKey: string): Promise<PulledAppReview[]> {
    this.logger.info('app-reviews-pull-hook: Pulling Apple reviews via ASC API for app ID: ' + appleAppId);

    const { reviews: apiReviews, includedResponses } = await AppleAppStoreConnectHelper.fetchAllReviews(appleAppId, privateKey);

    // Build a map from customerReviewResponse ID to responseBody
    const responseMap = new Map<string, string>();
    for (const resp of includedResponses) {
      responseMap.set(resp.id, resp.attributes.responseBody);
    }

    const reviews: PulledAppReview[] = apiReviews.map((review) => {
      const responseId = review.relationships?.response?.data?.id;
      const responseText = responseId ? responseMap.get(responseId) : undefined;

      return {
        external_identifier: review.id,
        source_identifier: AppFeedbackSourceIdentifier.APPLE,
        title: review.attributes.title,
        content: review.attributes.body,
        source_rating_raw: review.attributes.rating,
        positive: review.attributes.rating >= 4,
        ...(responseText ? { response: responseText } : {}),
      };
    });

    this.logger.info('app-reviews-pull-hook: Fetched ' + reviews.length + ' Apple reviews via ASC API for app ID: ' + appleAppId);
    return reviews;
  }

  /**
   * Pull Google Play reviews using the Google Play Developer API.
   * Requires a valid service account key JSON for authentication.
   */
  async pullGoogleReviews(googlePlayPackageName: string, serviceAccountKeyJson: string): Promise<PulledAppReview[]> {
    this.logger.info('app-reviews-pull-hook: Pulling Google Play reviews for package: ' + googlePlayPackageName);

    const googleReviews = await GooglePlayHelper.fetchAllReviews(googlePlayPackageName, serviceAccountKeyJson, this.logger);

    const reviews: PulledAppReview[] = [];
    for (const review of googleReviews) {
      const userComment = review.comments?.[0]?.userComment;
      if (!userComment) {
        continue;
      }

      const developerComment = review.comments?.[0]?.developerComment;
      const rating = userComment.starRating;

      reviews.push({
        external_identifier: review.reviewId,
        source_identifier: AppFeedbackSourceIdentifier.GOOGLE_PLAY,
        title: review.authorName || undefined,
        content: userComment.text,
        source_rating_raw: rating,
        positive: rating >= 4,
        ...(developerComment?.text ? { response: developerComment.text } : {}),
      });
    }

    this.logger.info('app-reviews-pull-hook: Fetched ' + reviews.length + ' Google Play reviews for package: ' + googlePlayPackageName);
    if (reviews.length === 0) {
      this.logger.info('app-reviews-pull-hook: Note: The Google Play Developer API only returns reviews from approximately the last 7 days. If your app has older reviews only, they will not appear here.');
    }
    return reviews;
  }
}
