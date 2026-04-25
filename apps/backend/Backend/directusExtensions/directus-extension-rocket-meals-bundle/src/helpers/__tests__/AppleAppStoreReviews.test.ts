// Integration test: fetch Apple App Store reviews via public RSS feed (no key required)
// and optionally respond to a review using the App Store Connect API (requires APP_STORE_CONNECT_PRIVATE_KEY).
import { describe, expect, it } from '@jest/globals';
import { AppleAppStoreConnectHelper } from '../AppleAppStoreConnectHelper';
import { AppleAppStoreRssHelper } from '../AppleAppStoreRssHelper';
import { EnvVariableHelper } from '../EnvVariableHelper';
import { getCustomerConfigsDict, ConfigCustomerEnum } from '../../../../../../../frontend/app/config';

const customerConfigs = getCustomerConfigsDict();

describe('Apple App Store Reviews via RSS (no key required)', () => {
  it('fetches reviews for Swosy via RSS and checks they exist with IDs', async () => {
    const appleAppId = customerConfigs[ConfigCustomerEnum.SWOSY].appleAppId;
    if (!appleAppId) {
      console.log('Skipping: No Apple App ID configured for Swosy');
      return;
    }

    const result = await AppleAppStoreRssHelper.fetchReviews(appleAppId);

    expect(result).toBeDefined();
    expect(result.feed).toBeDefined();
    const entries = result.feed.entry;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries!.length).toBeGreaterThan(0);

    const entry = entries![0];
    expect(entry).toBeDefined();
    if (!entry) return;

    const reviewId = AppleAppStoreRssHelper.getReviewId(entry);
    expect(typeof reviewId).toBe('string');
    expect(reviewId.length).toBeGreaterThan(0);

    const rating = AppleAppStoreRssHelper.getReviewRating(entry);
    expect(typeof rating).toBe('number');
    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(5);

    const title = AppleAppStoreRssHelper.getReviewTitle(entry);
    expect(typeof title).toBe('string');

    const body = AppleAppStoreRssHelper.getReviewBody(entry);
    expect(typeof body).toBe('string');
  }, 30000);

  it('fetches reviews for Studi-Futter via RSS and checks they exist with IDs', async () => {
    const appleAppId = customerConfigs[ConfigCustomerEnum.STUDI_FUTTER].appleAppId;
    if (!appleAppId) {
      console.log('Skipping: No Apple App ID configured for Studi-Futter');
      return;
    }

    const result = await AppleAppStoreRssHelper.fetchReviews(appleAppId);

    expect(result).toBeDefined();
    expect(result.feed).toBeDefined();
    const entries = result.feed.entry;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries!.length).toBeGreaterThan(0);

    const entry = entries![0];
    expect(entry).toBeDefined();
    if (!entry) return;

    const reviewId = AppleAppStoreRssHelper.getReviewId(entry);
    expect(typeof reviewId).toBe('string');
    expect(reviewId.length).toBeGreaterThan(0);

    const rating = AppleAppStoreRssHelper.getReviewRating(entry);
    expect(typeof rating).toBe('number');
    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(5);
  }, 30000);
});

describe('Apple App Store Review responses via ASC API (requires APP_STORE_CONNECT_PRIVATE_KEY)', () => {
  it('responds to a Swosy review using the ID from RSS', async () => {
    const privateKey = EnvVariableHelper.getAppStoreConnectPrivateKey();
    if (!privateKey) {
      console.log('Skipping: APP_STORE_CONNECT_PRIVATE_KEY not set');
      return;
    }

    const appleAppId = customerConfigs[ConfigCustomerEnum.SWOSY].appleAppId;
    if (!appleAppId) {
      console.log('Skipping: No Apple App ID configured for Swosy');
      return;
    }

    const rssResult = await AppleAppStoreRssHelper.fetchReviews(appleAppId);
    const entries = rssResult.feed.entry;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries!.length).toBeGreaterThan(0);

    const reviewId = AppleAppStoreRssHelper.getReviewId(entries![0]!);
    expect(typeof reviewId).toBe('string');
    expect(reviewId.length).toBeGreaterThan(0);

    // respondToReview should not throw; the API returns 201 or 409 (already responded)
    await expect(
      AppleAppStoreConnectHelper.respondToReview(reviewId, 'Vielen Dank für dein Feedback!', privateKey)
    ).resolves.not.toThrow();
  }, 30000);
});

