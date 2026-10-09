/**
 * feature-wishes-endpoint – the review state of wishes an anonymous app user submitted.
 *
 * `GET /feature-wishes/status?ids=<id>,<id>` answers `{ data: [{ id, status, progress, likes_amount, related_to, date_updated,
 * date_created, moderation_note_public }] }` for the given ids.
 *
 * Anonymous users may only read published wishes (the Directus policies cannot limit a second read
 * rule to other fields). Their app remembers the ids of its own wishes and asks here instead. Only
 * known ids are answered, nothing can be listed, no title or description is returned and likes are
 * left out, so nobody learns the id of someone else's like (which anonymous users may delete).
 */
import { defineEndpoint } from '@directus/extensions-sdk';
import { CollectionNames, DatabaseTypes, FeatureWishHelper, FeatureWishStatus } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

const ENDPOINT_ID = 'feature-wishes';

const STATUS_FIELDS = ['id', 'status', 'progress', 'likes_amount', 'related_to', 'date_updated', 'date_created', 'moderation_note_public'];

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.get('/status', async (req: any, res: any) => {
      const ids = FeatureWishHelper.parseStatusIds(req.query?.ids);
      if (ids.length === 0) {
        return res.json({ data: [] });
      }
      try {
        const myDatabaseHelper = new MyDatabaseHelper(apiContext);
        const wishes = await myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.FeatureWhishes>(CollectionNames.FEATURE_WHISHES).readByQuery({
          filter: { _and: [{ id: { _in: ids } }, { status: { _neq: FeatureWishStatus.LIKE } }] } as any,
          fields: STATUS_FIELDS,
          limit: ids.length,
        });
        return res.json({ data: wishes });
      } catch (error) {
        apiContext.logger.error(`${ENDPOINT_ID}: could not read the status of feature wishes: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ error: 'Could not read the feature wishes.' });
      }
    });
  },
});
