import { CollectionNames, DatabaseTypes, FriendshipStatus } from 'repo-depkit-common';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { HookKeysHelper } from '../helpers/HookKeysHelper';

const HOOK_NAME = 'friendships-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, ({ filter }, apiContext) => {
  filter(CollectionNames.FRIENDSHIPS + '.items.update', async (payload, meta, eventContext) => {
    const typedPayload = payload as Partial<DatabaseTypes.Friendships>;
    const isBeingAccepted = typedPayload?.friendship_status === FriendshipStatus.ACCEPTED;
    if (!isBeingAccepted) {
      return payload;
    }

    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const friendshipsHelper = new ItemsServiceHelper<DatabaseTypes.Friendships>(myDatabaseHelper, CollectionNames.FRIENDSHIPS);

    const itemIds = HookKeysHelper.getKeysFromMeta(meta);

    // Sequential on purpose: a delete in one iteration can remove friendships a later iteration would read (same profile pair), and it keeps DB load of this filter hook bounded.
    for (const friendshipId of itemIds) {
      let currentFriendship: DatabaseTypes.Friendships;
      try {
        currentFriendship = await friendshipsHelper.readOne(friendshipId); // NOSONAR S9382 - sequential on purpose, see comment above
      } catch {
        continue;
      }

      const requesterId = ItemsServiceHelper.getPrimaryKeyFromItemOrString(currentFriendship.requester_profiles_id);
      const receiverId = typedPayload.receiver_profiles_id ? ItemsServiceHelper.getPrimaryKeyFromItemOrString(typedPayload.receiver_profiles_id) : ItemsServiceHelper.getPrimaryKeyFromItemOrString(currentFriendship.receiver_profiles_id);

      if (!requesterId || !receiverId) {
        continue;
      }

      const existingFriendships = await friendshipsHelper.readByQuery({ // NOSONAR S9382 - sequential on purpose, see comment above
        filter: {
          _and: [
            { friendship_status: { _eq: FriendshipStatus.ACCEPTED } },
            { id: { _neq: String(friendshipId) } },
            {
              _or: [
                {
                  _and: [{ requester_profiles_id: { _eq: String(requesterId) } }, { receiver_profiles_id: { _eq: String(receiverId) } }],
                },
                {
                  _and: [{ requester_profiles_id: { _eq: String(receiverId) } }, { receiver_profiles_id: { _eq: String(requesterId) } }],
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
        await friendshipsHelper.deleteMany(idsToDelete); // NOSONAR S9382 - sequential on purpose, see comment above
      }
    }

    return payload;
  });
});
