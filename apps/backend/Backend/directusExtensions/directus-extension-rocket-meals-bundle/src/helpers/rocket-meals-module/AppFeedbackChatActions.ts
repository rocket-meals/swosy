/**
 * AppFeedbackChatActions.ts – the writes of the page "App-Feedbacks": create the chat of a
 * feedback (exactly like the `app-feedbacks-hook` does), mark feedbacks as done and answer store
 * reviews.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { AppFeedbackChatStatusHelper } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { AppFeedbackChatHelper, type AppFeedbackListItem } from './AppFeedbackChatHelper';
import { FoodFeedbackChatHelper } from './FoodFeedbackChatHelper';
import { SupportChatActions, type MarkResolvedResult, type SupportChatApiClient } from './SupportChatActions';

export class AppFeedbackChatActions {
  /**
   * The chat of a feedback. Usually the `app-feedbacks-hook` created it already; for older
   * feedbacks (or when that failed) it is created here, the author added as participant and the
   * chat linked to the feedback, so the author finds it in the app.
   */
  static async ensureChat(api: SupportChatApiClient, feedback: AppFeedbackListItem): Promise<string> {
    const existingChatId = RelationHelper.getId(feedback.chat);
    if (existingChatId) {
      return existingChatId;
    }
    const profileId = RelationHelper.getId(feedback.profile);
    if (!profileId) {
      throw new Error('app feedback has no profile');
    }
    const chatResponse = await api.post(FoodFeedbackChatHelper.CHATS_ENDPOINT, AppFeedbackChatStatusHelper.buildChatForFeedback(feedback));
    const createdChatId = String(chatResponse.data?.data?.id);
    await api.post(FoodFeedbackChatHelper.CHATS_PARTICIPANTS_ENDPOINT, ChatHelper.buildParticipant(createdChatId, profileId));
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { chat: createdChatId });
    return createdChatId;
  }

  /** Marks feedbacks as done, see {@link SupportChatActions.markResolved}. */
  static async markResolved(api: SupportChatApiClient, feedbacks: readonly AppFeedbackListItem[]): Promise<MarkResolvedResult> {
    return SupportChatActions.markResolved(api, feedbacks, {
      canStartChat: AppFeedbackChatStatusHelper.canStartChat,
      ensureChat: AppFeedbackChatActions.ensureChat,
    });
  }

  /**
   * Answers a store review: the text goes to `app_feedbacks.response`, and the
   * `app-reviews-pull-hook` publishes it in the App Store or on Google Play (it rejects the write
   * when that store is not configured).
   */
  static async setStoreResponse(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>, response: string): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { response });
  }
}
