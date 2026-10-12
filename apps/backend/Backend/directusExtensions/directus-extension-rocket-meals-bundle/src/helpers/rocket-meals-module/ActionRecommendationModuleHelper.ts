/**
 * ActionRecommendationModuleHelper.ts – what the endpoint `action-recommendations` and the module
 * pages share: routes, the fields of a stored recommendation and the error codes.
 *
 * No Vue imports, so it runs in the Node tests.
 */

/** Why a request to the endpoint failed, sent as `code` next to `error`. */
export enum ActionRecommendationErrorCode {
  UNKNOWN_COLLECTION = 'unknown_collection',
  AI_NOT_CONFIGURED = 'ai_not_configured',
  AI_FAILED = 'ai_failed',
}

export class ActionRecommendationModuleHelper {
  static readonly ENDPOINT_ID = 'action-recommendations';
  static readonly RECOMMEND_ROUTE = '/recommend';
  static readonly SUMMARIZE_ROUTE = '/summarize';

  /** The fields of `action_recommendations` the module shows. */
  static readonly FIELDS = ['id', 'collection', 'item', 'action', 'reason', 'draft_reply', 'state', 'recommended_by_ai', 'recommended_by_user', 'user_created', 'date_created'];
}
