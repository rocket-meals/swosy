import { COLLECTABLE_AT_FIELDS, CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const HOOK_NAME = 'collectible-events-hook';

function normalizePayload(
  payload: Partial<DatabaseTypes.CollectibleEvents> | Partial<DatabaseTypes.CollectibleEvents>[]
) {
  return Array.isArray(payload) ? payload : [payload];
}

function calculateMaxPoints(eventData: Partial<DatabaseTypes.CollectibleEvents>): number {
  return COLLECTABLE_AT_FIELDS.reduce((total, field) => {
    return total + (eventData[field] === true ? 1 : 0);
  }, 0);
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ filter }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);
  const collectibleEventsHelper = myDatabaseHelper.getCollectibleEventsHelper();

  filter(CollectionNames.COLLECTIBLE_EVENTS + '.items.create', async payload => {
    const payloadArray = normalizePayload(payload);

    const updatedPayload = payloadArray.map(item => {
      const maxPoints = calculateMaxPoints(item);
      return {
        ...item,
        points_maximum: String(maxPoints),
      };
    });

    return Array.isArray(payload) ? updatedPayload : updatedPayload[0];
  });

  filter(CollectionNames.COLLECTIBLE_EVENTS + '.items.update', async (payload, meta) => {
    const payloadArray = normalizePayload(payload);
    const itemIds = (Array.isArray(meta.keys)
      ? (meta.keys as (string | number | undefined)[])
      : meta.keys
        ? [meta.keys as string | number]
        : []
    ).filter((id): id is string | number => id !== undefined && id !== null);

    const existingItems = itemIds.length > 0 ? await collectibleEventsHelper.readMany(itemIds) : [];
    const existingItemsById = existingItems.reduce<Record<string, DatabaseTypes.CollectibleEvents>>((acc, current) => {
      if (current?.id) {
        acc[String(current.id)] = current;
      }
      return acc;
    }, {});

    const updatedPayload = payloadArray.map((item, index) => {
      const itemId = itemIds[index];
      const existingItem = itemId !== undefined ? existingItemsById[String(itemId)] : undefined;
      const mergedItem = {
        ...existingItem,
        ...item,
      } as Partial<DatabaseTypes.CollectibleEvents>;

      const maxPoints = calculateMaxPoints(mergedItem);

      return {
        ...item,
        points_maximum: String(maxPoints),
      };
    });

    return Array.isArray(payload) ? updatedPayload : updatedPayload[0];
  });
});
