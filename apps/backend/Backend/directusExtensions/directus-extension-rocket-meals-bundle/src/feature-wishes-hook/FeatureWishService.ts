import { PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, FeatureWishHelper, FeatureWishStatus } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { PushNotificationHelper } from '../helpers/PushNotificationHelper';
import { BackendLanguageResolver, BackendTranslationKeys } from '../helpers/translations';

type FeatureWish = DatabaseTypes.FeatureWhishes;

/**
 * Backend operations on `feature_whishes` that span several rows: counting likes, deleting a wish
 * together with its duplicates and likes, and flattening chains of merged wishes.
 *
 * All reads and writes run with admin rights (see `ItemsServiceCreator`).
 */
export class FeatureWishService {
  private readonly myDatabaseHelper: MyDatabaseHelper;

  constructor(myDatabaseHelper: MyDatabaseHelper) {
    this.myDatabaseHelper = myDatabaseHelper;
  }

  private getHelper(): ItemsServiceHelper<FeatureWish> {
    return this.myDatabaseHelper.getItemsServiceHelper<FeatureWish>(CollectionNames.FEATURE_WHISHES);
  }

  async readMany(ids: PrimaryKey[], fields: string[]): Promise<FeatureWish[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.getHelper().readByQuery({ filter: { id: { _in: ids } } as any, fields, limit: -1 });
  }

  /** The profile of a Directus user, needed to store who created a wish or a like. */
  async getProfileIdOfUser(userId: string | null | undefined): Promise<string | null> {
    if (!userId) {
      return null;
    }
    const user = await this.myDatabaseHelper.getUsersHelper().readOne(userId, { fields: ['profile'] });
    const profile = (user as { profile?: string | { id: string } | null } | undefined)?.profile;
    if (!profile) {
      return null;
    }
    return typeof profile === 'string' ? profile : profile.id;
  }

  async hasLikeOfProfile(profileId: string, wishId: string): Promise<boolean> {
    const existing = await this.getHelper().readByQuery({
      filter: {
        _and: [{ profile: { _eq: profileId } }, { related_to: { _eq: wishId } }, { status: { _eq: FeatureWishStatus.LIKE } }],
      } as any,
      fields: ['id'],
      limit: 1,
    });
    return existing.length > 0;
  }

  /**
   * Recomputes `likes_amount` of every wish (its author plus the `merged` and `like` rows pointing
   * to it) and writes only the values that changed. Written directly to the table, so `date_updated` (and
   * with it the 30 day timer of archived wishes) stays untouched and no hooks run again.
   */
  async recountAllLikes(): Promise<number> {
    const helper = this.getHelper();
    const countingRows = await helper.readByQuery({
      filter: { _and: [{ status: { _in: FeatureWishHelper.COUNTING_STATUSES } }, { related_to: { _nnull: true } }] } as any,
      fields: ['status', 'related_to'],
      limit: -1,
    });
    const counts = FeatureWishHelper.countLikesByWishId(countingRows);

    const wishes = await helper.readByQuery({
      filter: { status: { _nin: FeatureWishHelper.COUNTING_STATUSES } } as any,
      fields: ['id', 'likes_amount'],
      limit: -1,
    });

    let changed = 0;
    for (const wish of wishes) {
      const expected = FeatureWishHelper.getExpectedLikesAmount(wish.id, counts);
      if (wish.likes_amount !== expected) {
        await helper.updateOneWithoutHookTrigger({ primary_key: wish.id, update: { likes_amount: expected } });
        changed++;
      }
    }
    return changed;
  }

  /**
   * All rows that point to one of the given wishes, directly or through other rows (duplicates of
   * duplicates, likes of duplicates).
   */
  async findDependentIds(ids: PrimaryKey[]): Promise<string[]> {
    const helper = this.getHelper();
    const seen = new Set<string>(ids.map(String));
    const dependentIds: string[] = [];
    let current = ids.map(String);
    while (current.length > 0) {
      const rows = await helper.readByQuery({ filter: { related_to: { _in: current } } as any, fields: ['id'], limit: -1 });
      const next = rows.map(row => String(row.id)).filter(id => !seen.has(id));
      next.forEach(id => seen.add(id));
      dependentIds.push(...next);
      current = next;
    }
    return dependentIds;
  }

  /**
   * Deletes the duplicates and likes of the given wishes, so the foreign key of `related_to`
   * ("prevent the deletion") does not block deleting the wishes themselves. Hooks are not emitted
   * for these rows, the caller recounts afterwards.
   */
  async deleteDependents(ids: PrimaryKey[]): Promise<number> {
    const dependentIds = await this.findDependentIds(ids);
    if (dependentIds.length > 0) {
      // One statement: "NO ACTION" is checked at its end, when all rows of the chain are gone.
      await this.getHelper().deleteByQuery({ filter: { id: { _in: dependentIds } } as any, limit: -1 }, { emitEvents: false });
    }
    return dependentIds.length;
  }

  /** Deletes wishes together with everything that points to them. */
  async deleteWithDependents(ids: PrimaryKey[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }
    const dependentCount = await this.deleteDependents(ids);
    await this.getHelper().deleteMany(ids);
    return dependentCount + ids.length;
  }

  /**
   * A wish was merged into another one: point it to the final original (when the target is merged
   * itself) and move every row that pointed to it over to that original as well.
   */
  async flattenMerges(ids: PrimaryKey[]): Promise<void> {
    const helper = this.getHelper();
    const relatedToCache: Record<string, string | null> = {};
    const getRelatedToOfMerged = async (id: string): Promise<string | null> => {
      if (id in relatedToCache) {
        return relatedToCache[id] ?? null;
      }
      const rows = await this.readMany([id], ['id', 'status', 'related_to']);
      const row = rows[0];
      const value = row && row.status === FeatureWishStatus.MERGED ? FeatureWishHelper.getRelatedToId(row) : null;
      relatedToCache[id] = value;
      return value;
    };

    for (const id of ids.map(String)) {
      // Load the chain into the cache, then let the shared helper resolve it (it also stops on cycles).
      let current: string | null = id;
      for (let step = 0; step < 10 && current; step++) {
        current = await getRelatedToOfMerged(current);
      }
      const finalTarget = FeatureWishHelper.resolveMergeTarget(id, candidate => relatedToCache[candidate] ?? null);
      if (finalTarget === id) {
        continue;
      }
      if (relatedToCache[id] !== finalTarget) {
        await helper.updateOneWithoutHookTrigger({ primary_key: id, update: { related_to: finalTarget } });
      }
      const pointingToId = await helper.readByQuery({ filter: { related_to: { _eq: id } } as any, fields: ['id'], limit: -1 });
      for (const row of pointingToId) {
        await helper.updateOneWithoutHookTrigger({ primary_key: row.id, update: { related_to: finalTarget } });
      }
    }
  }

  /** After the author edited a wish it goes back to review: old suggestions and notes no longer fit. */
  async resetAfterAuthorEdit(ids: PrimaryKey[]): Promise<void> {
    const helper = this.getHelper();
    for (const id of ids) {
      await helper.updateOneWithoutHookTrigger({
        primary_key: id,
        update: { related_to: null, moderation_note_intern: null, moderation_note_public: null },
      });
    }
  }

  /** Tells the authors (with account and a device for pushes) that their wish is public now. */
  async notifyAuthorsAboutPublishing(wishIds: PrimaryKey[]): Promise<number> {
    const wishes = await this.readMany(wishIds, ['id', 'title', 'profile']);
    const languageResolver = new BackendLanguageResolver(this.myDatabaseHelper);
    let sent = 0;
    for (const wish of wishes) {
      const profileId = typeof wish.profile === 'string' ? wish.profile : (wish.profile?.id ?? null);
      if (!profileId) {
        continue;
      }
      const devices = await this.myDatabaseHelper.getDevicesHelper().readManyByProfileId(profileId);
      const expoPushTokens = PushNotificationHelper.getExpoPushTokensFromDevices(devices);
      if (expoPushTokens.length === 0) {
        continue;
      }
      const profile = await this.myDatabaseHelper.getProfilesHelper().readOne(profileId).catch(() => undefined);
      const language = await languageResolver.resolveForProfile(profile);
      await this.myDatabaseHelper.getPushNotificationsHelper().createOne({
        expo_push_tokens: expoPushTokens,
        message_title: language.translate(BackendTranslationKeys.notification_feature_wish_published_title),
        message_body: language.translate(BackendTranslationKeys.notification_feature_wish_published_body, { title: wish.title ?? '' }),
      });
      sent++;
    }
    return sent;
  }

  async findIdsOfProfiles(profileIds: PrimaryKey[]): Promise<string[]> {
    if (profileIds.length === 0) {
      return [];
    }
    const rows = await this.getHelper().readByQuery({ filter: { profile: { _in: profileIds } } as any, fields: ['id'], limit: -1 });
    return rows.map(row => String(row.id));
  }

  async findIdsOfUsers(userIds: PrimaryKey[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const rows = await this.getHelper().readByQuery({ filter: { user_created: { _in: userIds } } as any, fields: ['id'], limit: -1 });
    return rows.map(row => String(row.id));
  }
}
