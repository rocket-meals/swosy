// Integration test: fetch Apple App Store reviews for Swosy and Studi-Futter
// Requires APP_STORE_CONNECT_PRIVATE_KEY environment variable to be set.
// The test is skipped automatically when the private key is not available.
import { describe, expect, it } from '@jest/globals';
import { AppleAppStoreConnectHelper } from '../AppleAppStoreConnectHelper';
import { EnvVariableHelper } from '../EnvVariableHelper';

const SWOSY_APP_ID = '6667117575';
const STUDI_FUTTER_APP_ID = '1548108390';

describe('Apple App Store Reviews', () => {
  it('fetches reviews for Swosy and checks they exist', async () => {
    const privateKey = EnvVariableHelper.getAppStoreConnectPrivateKey();
    if (!privateKey) {
      console.log('Skipping: APP_STORE_CONNECT_PRIVATE_KEY not set');
      return;
    }

    const result = await AppleAppStoreConnectHelper.fetchReviews(SWOSY_APP_ID, privateKey);

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    const review = result.data[0];
    expect(review).toBeDefined();
    if (!review) return;
    expect(review.type).toBe('customerReviews');
    expect(review.id).toBeDefined();
    expect(review.attributes).toBeDefined();
    expect(typeof review.attributes.rating).toBe('number');
    expect(review.attributes.rating).toBeGreaterThanOrEqual(1);
    expect(review.attributes.rating).toBeLessThanOrEqual(5);
  }, 30000);

  it('fetches reviews for Studi-Futter and checks they exist', async () => {
    const privateKey = EnvVariableHelper.getAppStoreConnectPrivateKey();
    if (!privateKey) {
      console.log('Skipping: APP_STORE_CONNECT_PRIVATE_KEY not set');
      return;
    }

    const result = await AppleAppStoreConnectHelper.fetchReviews(STUDI_FUTTER_APP_ID, privateKey);

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    const review = result.data[0];
    expect(review).toBeDefined();
    if (!review) return;
    expect(review.type).toBe('customerReviews');
    expect(review.id).toBeDefined();
    expect(review.attributes).toBeDefined();
    expect(typeof review.attributes.rating).toBe('number');
    expect(review.attributes.rating).toBeGreaterThanOrEqual(1);
    expect(review.attributes.rating).toBeLessThanOrEqual(5);
  }, 30000);
});
