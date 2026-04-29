import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreConnectHelper } from '../helpers/AppleAppStoreConnectHelper';

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

  async pullGoogleReviews(googlePlayPackageName: string): Promise<PulledAppReview[]> {
    this.logger.info('app-reviews-pull-hook: Google Play review pull not yet implemented for package: ' + googlePlayPackageName);
    // Google Play reviews require the Google Play Developer API (OAuth2).
    // Implement via GooglePlayHelper once credentials are available.
    return [];
  }
}
