/**
 * action-recommendations-endpoint – AI action recommendations and summaries on request, for every
 * collection in `ActionRecommendationDefinitions` (food feedbacks, app feedbacks, …).
 *
 * `POST /action-recommendations/recommend` with `{ collection, ids, language }`: asks the AI what to
 * do with each item and stores the answers in `action_recommendations` (`status = draft`,
 * `recommended_by_ai` = provider and model, `user_created` = who asked). Answers
 * `{ data: ActionRecommendations[], ignored: string[] }`.
 *
 * `POST /action-recommendations/summarize` with `{ collection, group_value?, language }`: summarizes
 * the newest items with text, e.g. all comments on one food (`group_value` = the food id). Not
 * stored. Answers `{ data: { summary, key_points, item_count, recommended_by_ai } | null }`.
 *
 * Only for logged-in users. The items are read with their permissions, so only what they may read
 * is sent to the AI, and only the allowlisted fields. Nothing in the source collection is changed.
 * Needs `app_settings.ai_action_recommendations_enabled` and a provider under Settings → AI.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { ApiContext } from '../helpers/ApiContext';
import { ActionRecommendationDefinitions, type ActionRecommendationDefinition } from '../helpers/action-recommendations/ActionRecommendationDefinitions';
import { ActionRecommendationService, ActionRecommendationUnavailableReason } from '../helpers/action-recommendations/ActionRecommendationService';
import { ActionRecommendationErrorCode, ActionRecommendationModuleHelper } from '../helpers/rocket-meals-module/ActionRecommendationModuleHelper';

const ENDPOINT_ID = ActionRecommendationModuleHelper.ENDPOINT_ID;

type RequestContext = { accountability: Accountability; definition: ActionRecommendationDefinition; language: string; service: ActionRecommendationService };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Checks login, collection, app setting and AI provider. Sends the error response itself and returns null then. */
async function getRequestContext(apiContext: ApiContext, req: any, res: any): Promise<RequestContext | null> {
  const accountability = req?.accountability as Accountability | undefined;
  if (!accountability?.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const definition = ActionRecommendationDefinitions.getDefinition(req.body?.collection);
  if (!definition) {
    res.status(400).json({ error: 'This collection has no action recommendations.', code: ActionRecommendationErrorCode.UNKNOWN_COLLECTION });
    return null;
  }
  const service = await ActionRecommendationService.create(apiContext);
  if (service === ActionRecommendationUnavailableReason.DISABLED) {
    res.status(409).json({ error: 'Action recommendations are switched off in the app settings.', code: ActionRecommendationErrorCode.DISABLED });
    return null;
  }
  if (service === ActionRecommendationUnavailableReason.AI_NOT_CONFIGURED) {
    res.status(409).json({ error: 'No OpenAI-compatible provider is configured under Settings → AI.', code: ActionRecommendationErrorCode.AI_NOT_CONFIGURED });
    return null;
  }
  return { accountability, definition, language: ActionRecommendationDefinitions.parseLanguage(req.body?.language), service };
}

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post(ActionRecommendationModuleHelper.RECOMMEND_ROUTE, async (req: any, res: any) => {
      try {
        const context = await getRequestContext(apiContext, req, res);
        if (!context) {
          return;
        }
        const ids = ActionRecommendationDefinitions.parseItemIds(req.body?.ids);
        return res.json(await context.service.recommend(context.definition, ids, context.language, context.accountability));
      } catch (error) {
        apiContext.logger.error(`${ENDPOINT_ID}: recommendation failed: ${getErrorMessage(error)}`);
        return res.status(502).json({ error: 'The AI recommendation failed.', code: ActionRecommendationErrorCode.AI_FAILED });
      }
    });

    router.post(ActionRecommendationModuleHelper.SUMMARIZE_ROUTE, async (req: any, res: any) => {
      try {
        const context = await getRequestContext(apiContext, req, res);
        if (!context) {
          return;
        }
        return res.json({ data: await context.service.summarize(context.definition, req.body?.group_value, context.language, context.accountability) });
      } catch (error) {
        apiContext.logger.error(`${ENDPOINT_ID}: summary failed: ${getErrorMessage(error)}`);
        return res.status(502).json({ error: 'The AI summary failed.', code: ActionRecommendationErrorCode.AI_FAILED });
      }
    });
  },
});
