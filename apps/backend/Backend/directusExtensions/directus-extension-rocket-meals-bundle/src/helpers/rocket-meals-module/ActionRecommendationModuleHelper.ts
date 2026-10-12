/**
 * ActionRecommendationModuleHelper.ts – what the endpoint `action-recommendations` and the module
 * pages share: routes, the fields of a stored recommendation, error codes, and the reads and writes
 * of the pages (open recommendations of the listed items, archive one once it was used or turned down).
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports and runs in
 * the Node tests.
 */

import { ActionRecommendationAction, ActionRecommendationDefinitions, ActionRecommendationStatus } from '../action-recommendations/ActionRecommendationDefinitions';

/** Why a request to the endpoint failed, sent as `code` next to `error`. */
export enum ActionRecommendationErrorCode {
  UNKNOWN_COLLECTION = 'unknown_collection',
  DISABLED = 'disabled',
  AI_NOT_CONFIGURED = 'ai_not_configured',
  AI_FAILED = 'ai_failed',
}

/** A stored recommendation as the pages read it. */
export type ModuleActionRecommendation = {
  id: string;
  collection?: string | null;
  item?: string | null;
  action?: string | null;
  reason?: string | null;
  draft_reply?: string | null;
  status?: string | null;
  recommended_by_ai?: string | null;
  recommended_by_profile?: string | { id?: string; nickname?: string | null } | null;
  date_created?: string | null;
};

export type ActionRecommendationApiClient = {
  get: (url: string, config?: { params?: Record<string, unknown> }) => Promise<{ data?: any }>;
  patch: (url: string, data?: unknown) => Promise<{ data?: any }>;
};

export class ActionRecommendationModuleHelper {
  static readonly ENDPOINT_ID = 'action-recommendations';
  static readonly RECOMMEND_ROUTE = '/recommend';
  static readonly SUMMARIZE_ROUTE = '/summarize';

  static readonly ITEMS_ENDPOINT = '/items/action_recommendations';

  /** The fields of `action_recommendations` the module shows. */
  static readonly FIELDS = ['id', 'collection', 'item', 'action', 'reason', 'draft_reply', 'status', 'recommended_by_ai', 'recommended_by_profile', 'user_created', 'date_created'];

  /** The icon of recommendations everywhere in the module. */
  static readonly ICON = 'auto_awesome';

  /** Query parameter of a chat page: put the draft reply into the input right away. */
  static readonly USE_DRAFT_QUERY = 'use_draft';

  /** Open (`draft`) recommendations of the given items, newest first. */
  static buildOpenQuery(collection: string, itemIds: readonly (string | number)[]): Record<string, unknown> {
    return {
      fields: ActionRecommendationModuleHelper.FIELDS.join(','),
      filter: JSON.stringify({ _and: [{ collection: { _eq: collection } }, { item: { _in: itemIds.map(String) } }, { status: { _eq: ActionRecommendationStatus.DRAFT } }] }),
      sort: '-date_created',
      limit: -1,
    };
  }

  /** The newest recommendation per item; recommendations must come newest first. */
  static getNewestByItem(recommendations: readonly ModuleActionRecommendation[]): Record<string, ModuleActionRecommendation> {
    const byItem: Record<string, ModuleActionRecommendation> = {};
    for (const recommendation of recommendations) {
      const item = recommendation.item ? String(recommendation.item) : '';
      if (item && !byItem[item]) {
        byItem[item] = recommendation;
      }
    }
    return byItem;
  }

  /** Reads the open recommendations of the items; an empty list without items or when the read fails. */
  static async loadOpen(api: ActionRecommendationApiClient, collection: string, itemIds: readonly (string | number)[]): Promise<Record<string, ModuleActionRecommendation>> {
    if (itemIds.length === 0) {
      return {};
    }
    try {
      const response = await api.get(ActionRecommendationModuleHelper.ITEMS_ENDPOINT, { params: ActionRecommendationModuleHelper.buildOpenQuery(collection, itemIds) });
      return ActionRecommendationModuleHelper.getNewestByItem(response.data?.data ?? []);
    } catch (error) {
      // No permission on the table or the table does not exist yet: the page works as before.
      console.error('[rocket-meals-module] loading action recommendations failed', error);
      return {};
    }
  }

  /** Archives recommendations that were taken over or turned down, so they no longer show up. */
  static async archive(api: ActionRecommendationApiClient, recommendations: readonly (ModuleActionRecommendation | null | undefined)[]): Promise<void> {
    const keys = recommendations.filter((recommendation): recommendation is ModuleActionRecommendation => !!recommendation?.id).map(recommendation => recommendation.id);
    if (keys.length === 0) {
      return;
    }
    await api.patch(ActionRecommendationModuleHelper.ITEMS_ENDPOINT, { keys, data: { status: ActionRecommendationStatus.ARCHIVED } });
  }

  static isAction(recommendation: ModuleActionRecommendation | null | undefined, action: ActionRecommendationAction): boolean {
    return recommendation?.action === action;
  }

  /** The draft reply of a recommendation to reply, otherwise null. */
  static getDraftReply(recommendation: ModuleActionRecommendation | null | undefined): string | null {
    if (!ActionRecommendationModuleHelper.isAction(recommendation, ActionRecommendationAction.REPLY)) {
      return null;
    }
    const draft = recommendation?.draft_reply?.trim();
    return draft || null;
  }

  /** Who recommended it: provider and model of the AI, or the nickname of the profile. */
  static getRecommendedBy(recommendation: ModuleActionRecommendation | null | undefined): string | null {
    if (recommendation?.recommended_by_ai) {
      return recommendation.recommended_by_ai;
    }
    const profile = recommendation?.recommended_by_profile;
    if (profile && typeof profile === 'object') {
      return profile.nickname ?? profile.id ?? null;
    }
    return profile ?? null;
  }

  /** The label key of the recommended action, or null for an action this module does not know. */
  static getActionLabelKey(recommendation: ModuleActionRecommendation | null | undefined) {
    return ActionRecommendationDefinitions.getActionInfo(recommendation?.action)?.labelKey ?? null;
  }
}
