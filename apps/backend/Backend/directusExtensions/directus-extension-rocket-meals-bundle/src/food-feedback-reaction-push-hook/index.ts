/**
 * food-feedback-reaction-push-hook – tells the author of a food feedback by push when the canteen
 * reacted to it (`foods_feedbacks.support_reaction`, set in the module "Speise-Feedbacks"), and again
 * when the reaction changes. Removing the reaction sends nothing. See `FoodFeedbackReactionPush`.
 *
 * App users cannot write `support_reaction` (Directus policies), so every such update comes from
 * support or the backend.
 */
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { HookKeysHelper } from '../helpers/HookKeysHelper';
import { FoodFeedbackReactionPush } from './FoodFeedbackReactionPush';

const HOOK_NAME = 'food-feedback-reaction-push-hook';

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, ({ action }, apiContext) => {
  action(CollectionNames.FOODS_FEEDBACKS + '.items.update', async meta => {
    const payload = meta?.payload as Partial<DatabaseTypes.FoodsFeedbacks> | undefined;
    if (!payload?.support_reaction?.trim()) {
      return;
    }
    try {
      // Without the event context the reads and the push run as the backend, not as the support user.
      const sent = await FoodFeedbackReactionPush.notifyAuthors(new MyDatabaseHelper(apiContext), HookKeysHelper.getKeysFromMeta(meta));
      console.log(`${HOOK_NAME}: Sent ${sent} push notification(s) about a reaction to food feedbacks`);
    } catch (error) {
      console.error(`${HOOK_NAME}: Failed to send the push notifications about a reaction to food feedbacks`, error);
    }
  });
});
