import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';

const HOOK_NAME = 'friendships-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ filter }, apiContext) => {
  filter(CollectionNames.FRIENDSHIPS + '.items.update', async (payload, meta, eventContext) => {
    const typedPayload = payload as Partial<DatabaseTypes.Friendships>;
    const isBeingAccepted = typedPayload?.friendship_status === 'accepted';
    if (!isBeingAccepted) {
      return payload;
    }

    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const friendshipsHelper = new ItemsServiceHelper<DatabaseTypes.Friendships>(
      myDatabaseHelper,
      CollectionNames.FRIENDSHIPS
    );

    const metaKeysSingle = meta.keys ? [meta.keys as string | number] : [];
    const keysArray = Array.isArray(meta.keys)
      ? (meta.keys as (string | number | undefined)[])
      : metaKeysSingle;
    const itemIds = keysArray.filter((id): id is string | number => id !== undefined && id !== null);

    for (const friendshipId of itemIds) {
      let currentFriendship: DatabaseTypes.Friendships;
      try {
        currentFriendship = await friendshipsHelper.readOne(friendshipId);
      } catch {
        continue;
      }

      const requesterId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(currentFriendship.requester_profiles_id);
      const receiverId = typedPayload.receiver_profiles_id
        ? ItemsServiceHelper.getPrimaryKeyFromItemOrString(typedPayload.receiver_profiles_id)
        : ItemsServiceHelper.getPrimaryKeyFromItemOrString(currentFriendship.receiver_profiles_id);

      if (!requesterId || !receiverId) {
        continue;
      }

      const existingFriendships = await friendshipsHelper.readByQuery({
        filter: {
          _and: [
            { friendship_status: { _eq: 'accepted' } },
            { id: { _neq: String(friendshipId) } },
            {
              _or: [
                {
                  _and: [
                    { requester_profiles_id: { _eq: String(requesterId) } },
                    { receiver_profiles_id: { _eq: String(receiverId) } },
                  ],
                },
                {
                  _and: [
                    { requester_profiles_id: { _eq: String(receiverId) } },
                    { receiver_profiles_id: { _eq: String(requesterId) } },
                  ],
                },
              ],
            },
          ],
        } as any,
        limit: -1,
      });

      if (existingFriendships.length > 0) {
        const idsToDelete = existingFriendships.map(f => f.id);
        console.log(`${HOOK_NAME}: Deleting ${idsToDelete.length} existing friendship(s) between ${requesterId} and ${receiverId}`);
        await friendshipsHelper.deleteMany(idsToDelete);
      }
    }

    return payload;
  });
});
