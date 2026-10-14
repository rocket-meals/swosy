/**
 * app-store-ratings-endpoint – the current star rating of the app in the Apple App Store and in
 * Google Play.
 *
 * `GET /rocket-meals-app-store-ratings` answers `{ data: [{ store, average, count, store_url, error,
 * fetched_at }] }` (`AppStoreRating`), one entry per store configured for this customer
 * (`EnvVariableHelper.getAppleAppId` / `getGooglePlayPackageName`), none when no store is configured.
 * The page "App-Feedbacks" of the Rocket Meals module shows it next to the list.
 *
 * The browser cannot read the stores itself (Google Play sends no CORS headers), so the server asks
 * them and caches the answer for an hour (`AppStoreRatingsHelper`).
 *
 * Only for logged-in users; reveals nothing but the public ratings.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { AppStoreRatingsHelper } from '../helpers/AppStoreRatingsHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import type { AppStoreRatingsResponse } from '../helpers/rocket-meals-module/AppStoreRatingsModuleHelper';

const ENDPOINT_ID = 'rocket-meals-app-store-ratings';

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: router => {
    router.get('/', async (req: any, res: any) => {
      const accountability = req?.accountability as Accountability | undefined;
      if (!accountability?.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      try {
        const ratings = await AppStoreRatingsHelper.getRatings(EnvVariableHelper.getAppleAppId(), EnvVariableHelper.getGooglePlayPackageName());
        for (const rating of ratings) {
          if (rating.error) {
            console.error(`${ENDPOINT_ID}: could not read the ${rating.store} rating: ${rating.error}`);
          }
        }
        const body: AppStoreRatingsResponse = { data: ratings };
        return res.json(body);
      } catch (error) {
        console.error(ENDPOINT_ID + ': could not read the store ratings', error);
        return res.status(500).json({ error: 'Could not read the store ratings.' });
      }
    });
  },
});
