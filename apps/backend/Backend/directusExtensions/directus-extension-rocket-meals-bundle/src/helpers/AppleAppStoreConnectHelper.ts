import jwt from 'jsonwebtoken';
import { EXPO_ASC_ISSUER_ID, EXPO_ASC_KEY_ID } from 'repo-depkit-common';
import { FetchHelper } from './FetchHelper';

export type AppleCustomerReview = {
  type: 'customerReviews';
  id: string;
  attributes: {
    rating: number;
    title: string;
    body: string;
    reviewerNickname: string;
    createdDate: string;
    territory: string;
  };
};

export type AppleCustomerReviewsResponse = {
  data: AppleCustomerReview[];
  links?: {
    next?: string;
  };
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
};

export class AppleAppStoreConnectHelper {
  /**
   * Normalize a PEM private key string so that `jsonwebtoken` can parse it.
   * Environment variables often store the key with literal two-character `\n`
   * sequences instead of real newlines. This method converts them back and
   * ensures the PEM header/footer are present.
   */
  static normalizePemKey(raw: string): string {
    // Replace literal \n (two chars) with real newlines
    let key = raw.replace(/\\n/g, '\n');
    // Trim whitespace
    key = key.trim();
    return key;
  }

  private static generateJwt(privateKey: string): string {
    const normalizedKey = AppleAppStoreConnectHelper.normalizePemKey(privateKey);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: EXPO_ASC_ISSUER_ID,
      iat: now,
      exp: now + 20 * 60, // 20 minutes max
      aud: 'appstoreconnect-v1',
    };
    return jwt.sign(payload, normalizedKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: EXPO_ASC_KEY_ID,
        typ: 'JWT',
      },
    });
  }

  static async fetchReviews(appId: string, privateKey: string, url?: string): Promise<AppleCustomerReviewsResponse> {
    const token = AppleAppStoreConnectHelper.generateJwt(privateKey);
    const requestUrl = url || `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews?limit=100&sort=-createdDate`;
    const response = await FetchHelper.fetch(requestUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const json = (await response.json()) as AppleCustomerReviewsResponse;
    return json;
  }

  static async fetchAllReviews(appId: string, privateKey: string): Promise<AppleCustomerReview[]> {
    const allReviews: AppleCustomerReview[] = [];
    let nextUrl: string | undefined = undefined;

    while (true) {
      const response = await AppleAppStoreConnectHelper.fetchReviews(appId, privateKey, nextUrl);
      if (response.data && response.data.length > 0) {
        allReviews.push(...response.data);
      }
      if (response.links?.next) {
        nextUrl = response.links.next;
      } else {
        break;
      }
    }

    return allReviews;
  }

  static async respondToReview(reviewId: string, responseBody: string, privateKey: string): Promise<void> {
    const token = AppleAppStoreConnectHelper.generateJwt(privateKey);
    const url = `https://api.appstoreconnect.apple.com/v1/customerReviewResponses`;
    await FetchHelper.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'customerReviewResponses',
          attributes: { responseBody },
          relationships: {
            review: {
              data: { type: 'customerReviews', id: reviewId },
            },
          },
        },
      }),
    });
  }
}
