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
  meta?: {
    paging?: {
      total: number;
      limit: number;
    };
  };
};

export class AppleAppStoreConnectHelper {
  private static generateJwt(privateKey: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: EXPO_ASC_ISSUER_ID,
      iat: now,
      exp: now + 20 * 60, // 20 minutes max
      aud: 'appstoreconnect-v1',
    };
    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: EXPO_ASC_KEY_ID,
        typ: 'JWT',
      },
    });
  }

  static async fetchReviews(appId: string, privateKey: string): Promise<AppleCustomerReviewsResponse> {
    const token = AppleAppStoreConnectHelper.generateJwt(privateKey);
    const url = `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews?limit=5&sort=-createdDate`;
    const response = await FetchHelper.fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const json = (await response.json()) as AppleCustomerReviewsResponse;
    return json;
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
