import { CollectionNames, DatabaseTypes, FriendshipStatus } from 'repo-depkit-common';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const SCHEDULE_NAME = 'friendships_pending_cleanup';

const PENDING_DAYS_THRESHOLD = 31;

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ schedule }, apiContext) => {
  const cronFrequency = '0 20 * * 3'; // every Wednesday at 20:00

  schedule(cronFrequency, async () => {
    apiContext.logger.info(SCHEDULE_NAME + ': start schedule run: ' + new Date().toISOString());

    try {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const friendshipsHelper = new ItemsServiceHelper<DatabaseTypes.Friendships>(
        myDatabaseHelper,
        CollectionNames.FRIENDSHIPS
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - PENDING_DAYS_THRESHOLD);
      const cutoffDateISO = cutoffDate.toISOString();

      apiContext.logger.info(
        SCHEDULE_NAME + ': searching for pending friendships older than ' + cutoffDateISO
      );

      const pendingFriendships: DatabaseTypes.Friendships[] = await friendshipsHelper.readByQuery({
        filter: {
          _and: [
            { friendship_status: { _eq: FriendshipStatus.PENDING } },
            { date_created: { _lte: cutoffDateISO } },
          ],
        } as any,
        fields: ['id'],
        limit: -1,
      });

      apiContext.logger.info(
        SCHEDULE_NAME + ': found ' + pendingFriendships.length + ' pending friendships to delete'
      );

      if (pendingFriendships.length > 0) {
        const idsToDelete = pendingFriendships.map(f => f.id);
        await friendshipsHelper.deleteMany(idsToDelete);
        apiContext.logger.info(
          SCHEDULE_NAME + ': deleted ' + idsToDelete.length + ' pending friendships'
        );
      }
    } catch (e) {
      apiContext.logger.error(
        SCHEDULE_NAME + ': error during pending friendship cleanup: ' + (e instanceof Error ? e.message : String(e))
      );
      apiContext.logger.error(e);
    }
  });
});
