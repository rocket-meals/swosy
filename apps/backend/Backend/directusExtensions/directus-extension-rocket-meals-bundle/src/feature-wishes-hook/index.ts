/**
 * feature-wishes-hook – enforces the rules of `feature_whishes` (wishes, duplicates and likes in one
 * collection, see `FeatureWishHelper`).
 *
 * - App users only send `title`, `description` and `related_to`. The create filter decides whether
 *   it is a like (`related_to` set, no text) or a wish (`draft`), and sets `status` and `profile`.
 *   The Directus policies only allow exactly these fields, so nothing else can be set from outside.
 * - Editing by the author sends the wish back to review.
 * - `likes_amount` is recounted from the `merged` and `like` rows whenever one of them changes.
 * - Deleting a wish deletes its duplicates and likes first, because `related_to` uses "prevent the
 *   deletion" (Directus offers nothing else for a relation to the same collection).
 * - Deleting a profile or a user deletes their wishes and likes.
 *
 * Filter hooks run before Directus checks the permissions. They therefore only change the payload
 * for app users and never delete anything on their behalf; side effects happen in the actions.
 */
import { defineHook } from '@directus/extensions-sdk';
import { Accountability, PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, FeatureWishHelper, FeatureWishStatus } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { AccountabilityHelper } from '../helpers/AccountabilityHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { EventHelper } from '../helpers/EventHelper';
import { HookKeysHelper } from '../helpers/HookKeysHelper';
import { FeatureWishService } from './FeatureWishService';

const HOOK_NAME = 'feature-wishes-hook';

const FEATURE_WISHES = CollectionNames.FEATURE_WHISHES;

/** Statuses after which a suggested original in `related_to` no longer applies. */
const STATUSES_WITHOUT_RELATION: string[] = [
  FeatureWishStatus.DRAFT,
  FeatureWishStatus.AI_SUGGESTS_PUBLISH,
  FeatureWishStatus.AI_SUGGESTS_DECLINE,
  FeatureWishStatus.PUBLISHED,
  FeatureWishStatus.ARCHIVED,
];

/** App users (also anonymous ones). Admins, backend staff and the backend itself (no accountability) are not restricted. */
function isAppUser(accountability: Accountability | null | undefined): boolean {
  if (!accountability) {
    return false;
  }
  return !AccountabilityHelper.isAppAccessAccountability(accountability);
}

function getKeysFromFilterInput(input: unknown): PrimaryKey[] {
  return HookKeysHelper.toPrimaryKeys(input);
}

/** Wish ids of profiles or users being deleted, kept from the filter (before the delete) to the action (after it). */
const pendingOwnerDeletions = new Map<string, string[]>();

function getPendingKey(event: string, keys: PrimaryKey[]): string {
  return event + ':' + keys.map(String).sort().join(',');
}

export default defineHook(async ({ filter, action }, apiContext) => {
  const createService = (eventContext?: MyEventContext) => new FeatureWishService(new MyDatabaseHelper(apiContext, eventContext));

  async function recountSafely(eventContext?: MyEventContext) {
    try {
      await createService(eventContext).recountAllLikes();
    } catch (error) {
      apiContext.logger.error(`${HOOK_NAME}: could not recount likes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  filter(FEATURE_WISHES + '.items.create', async (input, _meta, eventContext: MyEventContext) => {
    if (!isAppUser(eventContext.accountability)) {
      return input;
    }
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const appSettings = await myDatabaseHelper.getAppSettingsHelper().getAppSettings();
    if (appSettings?.feature_wishes_enabled !== true) {
      throw createMyForbiddenError('Feature wishes are disabled.');
    }

    const service = new FeatureWishService(myDatabaseHelper);
    const profileId = await service.getProfileIdOfUser(eventContext.accountability?.user);
    const result = FeatureWishHelper.buildCreatePayload((input ?? {}) as Record<string, unknown>, profileId);
    if (!result.ok) {
      throw createMyForbiddenError('Invalid feature wish: ' + result.error);
    }

    if (result.isLike) {
      const targetId = result.payload.related_to as string;
      const [target] = await service.readMany([targetId], ['id', 'status']);
      if (target?.status !== FeatureWishStatus.PUBLISHED) {
        throw createMyForbiddenError('Only published feature wishes can be liked.');
      }
      if (profileId && (await service.hasLikeOfProfile(profileId, targetId))) {
        throw createMyForbiddenError('This feature wish is already liked.');
      }
    }
    return result.payload;
  });

  filter(FEATURE_WISHES + '.items.update', async (input, _meta, eventContext: MyEventContext) => {
    const payload = (input ?? {}) as Partial<DatabaseTypes.FeatureWhishes>;
    if (isAppUser(eventContext.accountability)) {
      const text = FeatureWishHelper.validateText(payload);
      if (!text.ok) {
        throw createMyForbiddenError('Invalid feature wish: ' + text.error);
      }
      // Changed text has to be reviewed again.
      return { title: text.title, description: text.description, status: FeatureWishStatus.DRAFT };
    }
    // A suggested or confirmed original no longer applies once the wish gets another decision.
    if (payload.status && STATUSES_WITHOUT_RELATION.includes(payload.status) && !('related_to' in payload)) {
      return { ...payload, related_to: null };
    }
    return payload;
  });

  filter(FEATURE_WISHES + '.items.delete', async (input, _meta, eventContext: MyEventContext) => {
    const keys = getKeysFromFilterInput(input);
    // App users may only delete their likes and unpublished wishes, nobody points to those. Their
    // request is not authorized yet at this point, so nothing is deleted on their behalf here.
    if (isAppUser(eventContext.accountability) || keys.length === 0) {
      return input;
    }
    await createService(eventContext).deleteDependents(keys);
    return input;
  });

  action(FEATURE_WISHES + '.items.create', async (meta, eventContext: MyEventContext) => {
    const payload = (meta.payload ?? {}) as Partial<DatabaseTypes.FeatureWhishes>;
    if (FeatureWishHelper.countsAsLike(payload)) {
      await recountSafely(eventContext);
    }
  });

  action(FEATURE_WISHES + '.items.update', async (meta, eventContext: MyEventContext) => {
    const keys = HookKeysHelper.getKeysFromMeta(meta);
    const payload = (meta.payload ?? {}) as Partial<DatabaseTypes.FeatureWhishes>;
    try {
      const service = createService(eventContext);
      if (isAppUser(eventContext.accountability)) {
        await service.resetAfterAuthorEdit(keys);
      }
      if (payload.status === FeatureWishStatus.MERGED || payload.related_to) {
        await service.flattenMerges(keys);
      }
    } catch (error) {
      apiContext.logger.error(`${HOOK_NAME}: could not process the update of ${keys.join(', ')}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if ('status' in payload || 'related_to' in payload) {
      await recountSafely(eventContext);
    }
  });

  action(FEATURE_WISHES + '.items.delete', async (_meta, eventContext: MyEventContext) => {
    await recountSafely(eventContext);
  });

  // Deleting a profile or a user never fails because of wishes: the relations are "nullify", the
  // filter only remembers the wishes and the action deletes them once the owner is gone.
  const ownerEvents: { event: string; findIds: (service: FeatureWishService, keys: PrimaryKey[]) => Promise<string[]> }[] = [
    { event: CollectionNames.PROFILES + '.items.delete', findIds: (service, keys) => service.findIdsOfProfiles(keys) },
    { event: EventHelper.USERS_DELETE_EVENT, findIds: (service, keys) => service.findIdsOfUsers(keys) },
  ];

  for (const { event, findIds } of ownerEvents) {
    filter(event, async (input, _meta, eventContext: MyEventContext) => {
      const keys = getKeysFromFilterInput(input);
      try {
        const wishIds = await findIds(createService(eventContext), keys);
        if (wishIds.length > 0) {
          pendingOwnerDeletions.set(getPendingKey(event, keys), wishIds);
        }
      } catch (error) {
        apiContext.logger.error(`${HOOK_NAME}: could not collect the feature wishes for ${event}: ${error instanceof Error ? error.message : String(error)}`);
      }
      return input;
    });

    action(event, async meta => {
      const pendingKey = getPendingKey(event, HookKeysHelper.getKeysFromMeta(meta));
      const wishIds = pendingOwnerDeletions.get(pendingKey);
      pendingOwnerDeletions.delete(pendingKey);
      if (!wishIds || wishIds.length === 0) {
        return;
      }
      try {
        // A fresh context: the transaction of the owner deletion is already committed.
        const deleted = await createService().deleteWithDependents(wishIds);
        apiContext.logger.info(`${HOOK_NAME}: deleted ${deleted} feature wishes after ${event}`);
      } catch (error) {
        apiContext.logger.error(`${HOOK_NAME}: could not delete the feature wishes after ${event}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await recountSafely();
    });
  }
});
