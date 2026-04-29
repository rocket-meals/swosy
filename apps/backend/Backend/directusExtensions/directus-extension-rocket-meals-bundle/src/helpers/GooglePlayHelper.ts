import jwt from 'jsonwebtoken';
import { FetchHelper } from './FetchHelper';

export type GooglePlayReviewComment = {
  userComment?: {
    text: string;
    lastModified: {
      seconds: string;
      nanos?: number;
    };
    starRating: number;
    reviewerLanguage?: string;
    device?: string;
    androidOsVersion?: number;
    appVersionCode?: number;
    appVersionName?: string;
    thumbsUpCount?: number;
    thumbsDownCount?: number;
    originalText?: string;
  };
  developerComment?: {
    text: string;
    lastModified: {
      seconds: string;
      nanos?: number;
    };
  };
};

export type GooglePlayReview = {
  reviewId: string;
  authorName: string;
  comments: GooglePlayReviewComment[];
};

export type GooglePlayReviewsResponse = {
  reviews?: GooglePlayReview[];
  tokenPagination?: {
    nextPageToken?: string;
  };
};

type GoogleServiceAccountKey = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
};

export class GooglePlayHelper {
  /**
   * Parse the service account JSON string into a typed object.
   */
  static parseServiceAccountKey(jsonString: string): GoogleServiceAccountKey {
    const parsed = JSON.parse(jsonString) as GoogleServiceAccountKey;
    if (!parsed.client_email || !parsed.private_key || !parsed.token_uri) {
      throw new Error('Invalid service account key JSON: missing client_email, private_key, or token_uri');
    }
    return parsed;
  }

  /**
   * Generate an OAuth2 access token from the service account key using JWT.
   * The token is valid for 1 hour.
   */
  static async getAccessToken(serviceAccountKey: GoogleServiceAccountKey): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountKey.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: serviceAccountKey.token_uri,
      iat: now,
      exp: now + 3600,
    };

    const signedJwt = jwt.sign(payload, serviceAccountKey.private_key, {
      algorithm: 'RS256',
    });

    const tokenResponse = await FetchHelper.fetch(serviceAccountKey.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt,
      }).toString(),
    });

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    return tokenData.access_token;
  }

  /**
   * Fetch reviews for a package from the Google Play Developer API.
   * Returns all reviews (paginated automatically).
   * Note: The Google Play Developer API only returns reviews from approximately the last 7 days.
   */
  static async fetchAllReviews(packageName: string, serviceAccountKeyJson: string, logger?: { info: (msg: string) => void }): Promise<GooglePlayReview[]> {
    const serviceAccountKey = GooglePlayHelper.parseServiceAccountKey(serviceAccountKeyJson);
    const accessToken = await GooglePlayHelper.getAccessToken(serviceAccountKey);

    const allReviews: GooglePlayReview[] = [];
    let nextPageToken: string | undefined = undefined;

    while (true) {
      const url = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/reviews`);
      url.searchParams.set('maxResults', '100');
      if (nextPageToken) {
        url.searchParams.set('token', nextPageToken);
      }

      const response = await FetchHelper.fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let data: GooglePlayReviewsResponse;
      try {
        data = JSON.parse(responseText) as GooglePlayReviewsResponse;
      } catch (e) {
        throw new Error(`Google Play API returned invalid JSON for package ${packageName}: ${responseText.substring(0, 500)}${responseText.length > 500 ? '... (truncated)' : ''}`);
      }

      if (logger && !data.reviews) {
        logger.info('GooglePlayHelper: API response has no reviews field. Response keys: ' + Object.keys(data).join(', '));
      }

      if (data.reviews && data.reviews.length > 0) {
        allReviews.push(...data.reviews);
      }

      if (data.tokenPagination?.nextPageToken) {
        nextPageToken = data.tokenPagination.nextPageToken;
      } else {
        break;
      }
    }

    return allReviews;
  }

  /**
   * Reply to a Google Play review.
   */
  static async replyToReview(packageName: string, reviewId: string, replyText: string, serviceAccountKeyJson: string): Promise<void> {
    const serviceAccountKey = GooglePlayHelper.parseServiceAccountKey(serviceAccountKeyJson);
    const accessToken = await GooglePlayHelper.getAccessToken(serviceAccountKey);

    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/reviews/${reviewId}:reply`;

    await FetchHelper.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replyText: replyText,
      }),
    });
  }
}
