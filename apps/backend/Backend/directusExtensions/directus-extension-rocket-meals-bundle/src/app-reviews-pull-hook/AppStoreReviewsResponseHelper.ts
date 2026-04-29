import { AppFeedbackSourceIdentifier, DatabaseTypes } from 'repo-depkit-common';
import { AppleAppStoreConnectHelper } from '../helpers/AppleAppStoreConnectHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

/**
 * Handles submitting responses back to the respective app store API
 * when a support team member writes a response to a store review.
 */
export class AppStoreReviewsResponseHelper {
  static isConfiguredForSource(sourceIdentifier: string | null | undefined): boolean {
    if (sourceIdentifier === AppFeedbackSourceIdentifier.APPLE) {
      return !!EnvVariableHelper.getAppStoreConnectPrivateKey();
    } else if (sourceIdentifier === AppFeedbackSourceIdentifier.GOOGLE_PLAY) {
      return !!EnvVariableHelper.getGooglePlayServiceAccountKeyJson();
    }
    return true;
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

    const externalId = feedback.external_identifier;
    if (!externalId) {
      this.logger.error('app-reviews-pull-hook: Cannot respond to review without external_identifier, feedback id: ' + feedback.id);
      return;
    }

    const sourceIdentifier = feedback.source_identifier;

    if (sourceIdentifier === AppFeedbackSourceIdentifier.APPLE) {
      await this.respondToAppleReview(externalId, responseText);
    } else if (sourceIdentifier === AppFeedbackSourceIdentifier.GOOGLE_PLAY) {
      await this.respondToGooglePlayReview(externalId, responseText);
    }
  }

  private async respondToAppleReview(reviewId: string, responseBody: string): Promise<void> {
    const privateKey = EnvVariableHelper.getAppStoreConnectPrivateKey();
    if (!privateKey) {
      throw new Error('Apple App Store Connect not configured (missing private key), cannot respond to review: ' + reviewId);
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
