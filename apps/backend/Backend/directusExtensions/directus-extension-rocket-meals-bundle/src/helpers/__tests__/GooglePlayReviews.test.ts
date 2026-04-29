import { describe, expect, it } from '@jest/globals';
import { GooglePlayHelper } from '../GooglePlayHelper';
import { EnvVariableHelper } from '../EnvVariableHelper';
import { SWOSY_APP_STORE_IDS } from 'repo-depkit-common';

describe('GooglePlayHelper.parseServiceAccountKey', () => {
  it('parses valid JSON with required fields', () => {
    const json = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'key-id',
      private_key: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----\n',
      client_email: 'test@test.iam.gserviceaccount.com',
      client_id: '123',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
    });

    const result = GooglePlayHelper.parseServiceAccountKey(json);
    expect(result.client_email).toBe('test@test.iam.gserviceaccount.com');
    expect(result.token_uri).toBe('https://oauth2.googleapis.com/token');
    expect(result.private_key).toContain('BEGIN RSA PRIVATE KEY');
  });

  it('throws on missing required fields', () => {
    const json = JSON.stringify({ type: 'service_account' });
    expect(() => GooglePlayHelper.parseServiceAccountKey(json)).toThrow('Invalid service account key JSON');
  });

  it('throws on invalid JSON', () => {
    expect(() => GooglePlayHelper.parseServiceAccountKey('not-json')).toThrow();
  });
});

describe('Google Play Reviews via Developer API (requires GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_JSON)', () => {
  it('fetches reviews via Google Play Developer API', async () => {
    const serviceAccountKeyJson = EnvVariableHelper.getGooglePlayServiceAccountKeyJson();
    if (!serviceAccountKeyJson) {
      console.log('Skipping: GOOGLE_PLAY_SERVICE_ACCOUNT_KEY_JSON not set');
      return;
    }

    const packageName = SWOSY_APP_STORE_IDS.googlePlayPackageName;
    if (!packageName) {
      console.log('Skipping: No Google Play package name configured for Swosy');
      return;
    }

    const reviews = await GooglePlayHelper.fetchAllReviews(packageName, serviceAccountKeyJson);
    expect(reviews).toBeDefined();
    expect(Array.isArray(reviews)).toBe(true);

    if (reviews.length > 0) {
      const review = reviews[0]!;
      expect(review.reviewId).toBeDefined();
      expect(typeof review.reviewId).toBe('string');
      expect(review.reviewId.length).toBeGreaterThan(0);
      expect(review.comments).toBeDefined();
      expect(Array.isArray(review.comments)).toBe(true);
      expect(review.comments.length).toBeGreaterThan(0);

      const userComment = review.comments[0]!.userComment;
      expect(userComment).toBeDefined();
      if (userComment) {
        expect(userComment.starRating).toBeGreaterThanOrEqual(1);
        expect(userComment.starRating).toBeLessThanOrEqual(5);
        expect(userComment.text).toBeDefined();
      }
    }
  }, 30000);
});
