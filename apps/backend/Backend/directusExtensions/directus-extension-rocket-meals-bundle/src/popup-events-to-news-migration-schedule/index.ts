import { DatabaseTypes } from 'repo-depkit-common';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { PopupEventToNewsMapper } from './PopupEventToNewsMapper';

const SCHEDULE_NAME = 'popup_events_to_news_migration';

/** Not in `CollectionNames` on purpose: the collection is only read here until it is removed. */
const POPUP_EVENTS_COLLECTION = 'popup_events';

/**
 * Popup events and news were merged: a popup event is now a news with `display_locations` "popup".
 * This copies every popup event that has no `migrated_news` yet into a new news and links it, so it
 * runs once per event, even when the news is deleted later. The popup events stay for app versions
 * that still read them.
 *
 * A schedule instead of a start hook: the schema (the new news fields) is pushed by backend-sync after
 * Directus has started, so the first runs may still see the old schema and skip.
 */
export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, ({ schedule }, apiContext) => {
  const cronEveryFifteenMinutes = '*/15 * * * *';

  const isSchemaReady = async (): Promise<boolean> => {
    const schema = await apiContext.getSchema();
    const newsFields = schema?.collections?.news?.fields ?? {};
    const popupEventFields = schema?.collections?.[POPUP_EVENTS_COLLECTION]?.fields ?? {};
    return !!newsFields.display_locations && !!newsFields.canteens && !!popupEventFields.migrated_news;
  };

  schedule(cronEveryFifteenMinutes, async () => {
    try {
      if (!(await isSchemaReady())) {
        apiContext.logger.info(SCHEDULE_NAME + ': schema without news display fields yet, skipping');
        return;
      }
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const popupEventsHelper = new ItemsServiceHelper<DatabaseTypes.PopupEvents>(myDatabaseHelper, POPUP_EVENTS_COLLECTION);
      const newsHelper = myDatabaseHelper.getNewsHelper();

      const popupEvents = await popupEventsHelper.readByQuery({
        fields: ['*', 'translations.*', 'canteens.*'],
        filter: { migrated_news: { _null: true } },
        limit: -1,
      });
      if (popupEvents.length === 0) {
        return;
      }
      apiContext.logger.info(SCHEDULE_NAME + ': migrating ' + popupEvents.length + ' popup events to news');

      // Sequential on purpose: each event creates a news with nested relations and then links it.
      for (const popupEvent of popupEvents) {
        const newsId = await newsHelper.createOne(PopupEventToNewsMapper.mapToNews(popupEvent)); // NOSONAR S9382 - sequential on purpose, see comment above
        await popupEventsHelper.updateOne(popupEvent.id, { migrated_news: String(newsId) }); // NOSONAR S9382 - sequential on purpose, see comment above
      }
    } catch (error) {
      apiContext.logger.error(SCHEDULE_NAME + ': migration failed: ' + String(error));
    }
  });
});
