/**
 * action-recommendations-hook
 *
 * 1. A new food feedback with a comment gets an AI recommendation right away (reply with a draft for
 *    the chat, or mark as done), stored in `action_recommendations`. Only with
 *    `app_settings.ai_action_recommendations_enabled` and a provider under Settings → AI; otherwise
 *    nothing happens. A failing AI never blocks the feedback: it is logged and the feedback simply
 *    has no recommendation.
 * 2. For every collection: when items are deleted, their recommendations are deleted too.
 *    `action_recommendations` points at any collection, so there is no foreign key to cascade.
 */
import { CollectionNames } from 'repo-depkit-common';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { HookKeysHelper } from '../helpers/HookKeysHelper';
import { ActionRecommendationDefinitions } from '../helpers/action-recommendations/ActionRecommendationDefinitions';
import { ActionRecommendationService } from '../helpers/action-recommendations/ActionRecommendationService';
import { BACKEND_DEFAULT_TRANSLATION_LANGUAGE } from '../helpers/translations/BackendTranslator';

const HOOK_NAME = 'action-recommendations-hook';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, ({ action }, apiContext) => {
  const foodFeedbackDefinition = ActionRecommendationDefinitions.getDefinition(CollectionNames.FOODS_FEEDBACKS);

  action(CollectionNames.FOODS_FEEDBACKS + '.items.create', async meta => {
    const comment = (meta.payload as { comment?: unknown } | undefined)?.comment;
    if (!foodFeedbackDefinition || typeof comment !== 'string' || comment.trim() === '') {
      return;
    }
    try {
      const service = await ActionRecommendationService.create(apiContext);
      if (!(service instanceof ActionRecommendationService)) {
        return;
      }
      // The support works in German, the draft reply itself is written in the language of the comment.
      await service.recommend(foodFeedbackDefinition, HookKeysHelper.getKeysFromMeta(meta).map(String), BACKEND_DEFAULT_TRANSLATION_LANGUAGE, null);
    } catch (error) {
      apiContext.logger.error(`${HOOK_NAME}: recommendation for a new food feedback failed: ${getErrorMessage(error)}`);
    }
  });

  action('items.delete', async meta => {
    try {
      await ActionRecommendationService.deleteForItems(apiContext, meta.collection, HookKeysHelper.getKeysFromMeta(meta));
    } catch (error) {
      apiContext.logger.error(`${HOOK_NAME}: deleting the recommendations of deleted items in ${String(meta.collection)} failed: ${getErrorMessage(error)}`);
    }
  });
});
