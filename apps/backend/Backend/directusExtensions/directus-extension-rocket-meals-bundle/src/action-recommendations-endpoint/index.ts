/**
 * action-recommendations-endpoint – AI action recommendations and summaries for every collection in
 * `ActionRecommendationDefinitions` (food feedbacks, app feedbacks, …).
 *
 * `POST /action-recommendations/recommend` with `{ collection, ids, language }`: asks the
 * OpenAI-compatible provider of the Directus settings (Settings → AI) what to do with each item and
 * stores the answers in `action_recommendations` (state `open`, `recommended_by_ai` = provider and
 * model, `user_created` = who asked). Earlier open AI recommendations of these items are replaced.
 * Answers `{ data: ActionRecommendation[], ignored: string[] }`.
 *
 * `POST /action-recommendations/summarize` with `{ collection, group_value?, language }`: summarizes
 * the newest items with text, e.g. all comments on one food (`group_value` = the food id, matched
 * against `summaryGroupField`). Not stored. Answers `{ data: ActionRecommendationSummaryResponse }`.
 *
 * The items are read with the permissions of the person asking, so only what they may read is sent
 * to the AI, and only the allowlisted fields of the definition. The AI only ever suggests: nothing
 * in the source collection is changed here.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { CollectionNames } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { DirectusOpenAiCompatibleClient } from '../helpers/ai/DirectusOpenAiCompatibleClient';
import { ActionRecommendationDefinitions, ActionRecommendationState, type ActionRecommendationDefinition } from '../helpers/action-recommendations/ActionRecommendationDefinitions';
import { ActionRecommendationPrompt, type ActionRecommendationSourceItem } from '../helpers/action-recommendations/ActionRecommendationPrompt';
import { ActionRecommendationErrorCode, ActionRecommendationModuleHelper } from '../helpers/rocket-meals-module/ActionRecommendationModuleHelper';

const ENDPOINT_ID = ActionRecommendationModuleHelper.ENDPOINT_ID;

type RequestContext = { accountability: Accountability; definition: ActionRecommendationDefinition; language: string; client: DirectusOpenAiCompatibleClient };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Checks login, collection and AI provider. Sends the error response itself and returns null then. */
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
  const client = await DirectusOpenAiCompatibleClient.fromDirectusSettings(apiContext);
  if (!client) {
    res.status(409).json({ error: 'No OpenAI-compatible provider is configured under Settings → AI.', code: ActionRecommendationErrorCode.AI_NOT_CONFIGURED });
    return null;
  }
  return { accountability, definition, language: ActionRecommendationDefinitions.parseLanguage(req.body?.language), client };
}

/** Reads the items with the permissions of the person asking, only the allowlisted fields. */
async function readSourceItems(apiContext: ApiContext, context: RequestContext, filter: Record<string, unknown>, limit: number): Promise<ActionRecommendationSourceItem[]> {
  const service = new apiContext.services.ItemsService(context.definition.collection, { schema: await apiContext.getSchema(), accountability: context.accountability });
  return (await service.readByQuery({
    filter: { _and: [filter, ActionRecommendationDefinitions.buildHasTextFilter(context.definition)] },
    fields: ActionRecommendationDefinitions.getReadFields(context.definition),
    sort: ['-date_created'],
    limit,
  })) as ActionRecommendationSourceItem[];
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
        if (ids.length === 0) {
          return res.json({ data: [], ignored: [] });
        }
        const items = await readSourceItems(apiContext, context, { id: { _in: ids } }, ids.length);
        if (items.length === 0) {
          return res.json({ data: [], ignored: [] });
        }

        const answer = await context.client.chatJson(ActionRecommendationPrompt.buildRecommendationPrompt(context.definition, items, context.language));
        const parsed = ActionRecommendationPrompt.parseRecommendations(answer, context.definition, new Set(items.map(item => String(item.id))));
        if (parsed.recommendations.length === 0) {
          return res.json({ data: [], ignored: parsed.ignored });
        }

        // Written as the person who asked, so `user_created` says who requested the recommendation. The
        // admin flag lets every role of the module write it without an extra permission on the table.
        const service = new apiContext.services.ItemsService(CollectionNames.ACTION_RECOMMENDATIONS, { schema: await apiContext.getSchema(), accountability: { ...context.accountability, admin: true } });
        await service.deleteByQuery({
          filter: {
            _and: [{ collection: { _eq: context.definition.collection } }, { item: { _in: parsed.recommendations.map(recommendation => recommendation.item) } }, { state: { _eq: ActionRecommendationState.OPEN } }, { recommended_by_ai: { _nnull: true } }],
          },
        });
        const recommendedByAi = context.client.getRecommenderLabel();
        const keys = await service.createMany(
          parsed.recommendations.map(recommendation => ({
            collection: context.definition.collection,
            item: recommendation.item,
            action: recommendation.action,
            reason: recommendation.reason,
            draft_reply: recommendation.draft_reply,
            state: ActionRecommendationState.OPEN,
            recommended_by_ai: recommendedByAi,
          }))
        );
        const created = await service.readMany(keys, { fields: ActionRecommendationModuleHelper.FIELDS });
        for (const reason of parsed.ignored) {
          apiContext.logger.warn(`${ENDPOINT_ID}: ignored part of the AI answer: ${reason}`);
        }
        return res.json({ data: created, ignored: parsed.ignored });
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
        const groupField = context.definition.summaryGroupField;
        const groupValue = req.body?.group_value;
        const filter = groupField && (typeof groupValue === 'string' || typeof groupValue === 'number') ? { [groupField]: { _eq: groupValue } } : {};
        const items = await readSourceItems(apiContext, context, filter, ActionRecommendationDefinitions.MAX_ITEMS_PER_SUMMARY);
        if (items.length === 0) {
          return res.json({ data: { summary: null, key_points: [], item_count: 0, recommended_by_ai: null } });
        }
        const answer = await context.client.chatJson(ActionRecommendationPrompt.buildSummaryPrompt(context.definition, items, context.language));
        const summary = ActionRecommendationPrompt.parseSummary(answer);
        return res.json({ data: { ...summary, item_count: items.length, recommended_by_ai: context.client.getRecommenderLabel() } });
      } catch (error) {
        apiContext.logger.error(`${ENDPOINT_ID}: summary failed: ${getErrorMessage(error)}`);
        return res.status(502).json({ error: 'The AI summary failed.', code: ActionRecommendationErrorCode.AI_FAILED });
      }
    });
  },
});
