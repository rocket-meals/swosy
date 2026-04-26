import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreConnectHelper } from '../helpers/AppleAppStoreConnectHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

/**
 * Handles submitting responses back to the respective app store API
 * when a support team member writes a response to a store review.
 */
export class AppStoreReviewsResponseHelper {
  static getMissingEnvVarsForSource(sourceIdentifier: string | null | undefined): string[] {
    if (sourceIdentifier === AppFeedbackSourceIdentifier.APPLE) {
      const missing: string[] = [];
      if (!EnvVariableHelper.getAppStoreConnectPrivateKey()) {
        missing.push('APP_STORE_CONNECT_PRIVATE_KEY');
      }
      return missing;
    } else if (sourceIdentifier === AppFeedbackSourceIdentifier.GOOGLE_PLAY) {
      const missing: string[] = [];
      if (!EnvVariableHelper.getGooglePlayServiceAccountKeyJson()) {
        missing.push('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_JSON');
      }
      return missing;
    }
    return [];
  }

  private readonly myDatabaseHelper: MyDatabaseHelper;
  private readonly logger: { info: (msg: string) => void; error: (msg: string) => void };

  constructor(myDatabaseHelper: MyDatabaseHelper, logger: { info: (msg: string) => void; error: (msg: string) => void }) {
    this.myDatabaseHelper = myDatabaseHelper;
    this.logger = logger;
  }

  async respondToReview(feedback: DatabaseTypes.AppFeedbacks): Promise<void> {
    const responseText = feedback.response;
    if (!responseText) {
      return;
    }

    const sourceIdentifier = feedback.source_identifier;

    if (sourceIdentifier === AppFeedbackSourceIdentifier.APPLE) {
      await this.respondToAppleReview(feedback.id, responseText);
    } else if (sourceIdentifier === AppFeedbackSourceIdentifier.GOOGLE_PLAY) {
      await this.respondToGooglePlayReview(feedback.id, responseText);
    }
  }

  private async respondToAppleReview(reviewId: string, responseBody: string): Promise<void> {
    const privateKey = EnvVariableHelper.getAppStoreConnectPrivateKey();
    if (!privateKey) {
      this.logger.info('app-reviews-pull-hook: APP_STORE_CONNECT_PRIVATE_KEY not set, cannot respond to Apple review: ' + reviewId);
      return;
    }

    this.logger.info('app-reviews-pull-hook: Responding to Apple review: ' + reviewId);
    await AppleAppStoreConnectHelper.respondToReview(reviewId, responseBody, privateKey);
    this.logger.info('app-reviews-pull-hook: Successfully responded to Apple review: ' + reviewId);
  }

  private async respondToGooglePlayReview(reviewId: string, _responseBody: string): Promise<void> {
    this.logger.info('app-reviews-pull-hook: Google Play review response not yet implemented for review: ' + reviewId);
    // Implement via Google Play Developer API once credentials are available.
  }
}
