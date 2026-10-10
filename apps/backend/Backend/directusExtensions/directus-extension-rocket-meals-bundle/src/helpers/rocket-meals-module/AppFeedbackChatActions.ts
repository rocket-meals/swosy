/**
 * AppFeedbackChatActions.ts – the writes of the page "App-Feedbacks": create the chat of a
 * feedback (exactly like the `app-feedbacks-hook` does), set the status of feedbacks and answer
 * store reviews and feedbacks without profile (by mail). The status is always written to
 * `app_feedbacks.state`, the `app-feedbacks-hook` passes it on to the chat.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { AppFeedbackChatStatusHelper, AppFeedbackState } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import type { FoodFeedbackChatStatus } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { AppFeedbackChatHelper, type AppFeedbackListItem } from './AppFeedbackChatHelper';
import { FoodFeedbackChatHelper } from './FoodFeedbackChatHelper';
import type { MarkResolvedResult, SupportChatApiClient } from './SupportChatActions';

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

  /** Marks feedbacks as done without answering them, all in one request. */
  static async markResolved(api: SupportChatApiClient, feedbacks: readonly AppFeedbackListItem[]): Promise<MarkResolvedResult> {
    const ids = feedbacks.map(feedback => feedback.id);
    if (ids.length === 0) {
      return { resolvedIds: [], failedIds: [] };
    }
    try {
      await api.patch(AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, { keys: ids, data: { state: AppFeedbackState.CLOSED } });
      return { resolvedIds: ids, failedIds: [] };
    } catch (error) {
      console.error('[rocket-meals-module] marking app feedbacks as resolved failed', error);
      return { resolvedIds: [], failedIds: ids };
    }
  }

  /** Sets the status of a feedback by hand. */
  static async setStatus(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>, status: FoodFeedbackChatStatus): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { state: AppFeedbackChatStatusHelper.getStateForStatus(status) });
  }

  /**
   * After support wrote in the chat: the feedback waits for the user. The `chat-conversation-state-hook`
   * sets that as well, but only after the request – this way the page shows it right away.
   */
  static async setAnsweredInChat(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { state: AppFeedbackState.WAITING_FOR_USER });
  }

  /**
   * Answers a feedback without profile by mail: the text goes to `app_feedbacks.response`, the
   * `app-feedbacks-hook` mails it to the contact email. There is nothing left to do afterwards, so
   * the feedback is marked as done in the same request.
   */
  static async sendMailResponse(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>, response: string): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { response, state: AppFeedbackState.CLOSED });
  }

  /**
   * Answers a store review: the text goes to `app_feedbacks.response`, and the
   * `app-reviews-pull-hook` publishes it in the App Store or on Google Play (it rejects the write
   * when that store is not configured). The review is done with that – the hook closes it as well.
   */
  static async setStoreResponse(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>, response: string): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { response, state: AppFeedbackState.CLOSED });
  }
}
