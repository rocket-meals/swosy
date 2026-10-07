/**
 * AppFeedbackChatActions.ts – the writes of the page "App-Feedbacks": create the chat of a
 * feedback (exactly like the `app-feedbacks-hook` does), mark feedbacks as done and answer store
 * reviews. Feedbacks without chat that will not get one (store reviews, no profile) are marked as
 * done via `app_feedbacks.state` instead.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { AppFeedbackChatStatusHelper, AppFeedbackState } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
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

  /**
   * Marks feedbacks as done without answering them. Store reviews and feedbacks without profile
   * get `state` = `closed` in one request; all others via their chat, see
   * {@link SupportChatActions.markResolved}.
   */
  static async markResolved(api: SupportChatApiClient, feedbacks: readonly AppFeedbackListItem[]): Promise<MarkResolvedResult> {
    const withoutChat = feedbacks.filter(AppFeedbackChatStatusHelper.isStatusWithoutChat);
    const withChat = feedbacks.filter(feedback => !AppFeedbackChatStatusHelper.isStatusWithoutChat(feedback));
    const result = await SupportChatActions.markResolved(api, withChat, {
      canStartChat: AppFeedbackChatStatusHelper.canStartChat,
      ensureChat: AppFeedbackChatActions.ensureChat,
    });
    if (withoutChat.length > 0) {
      const ids = withoutChat.map(feedback => feedback.id);
      try {
        await api.patch(AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, { keys: ids, data: { state: AppFeedbackState.CLOSED } });
        result.resolvedIds.push(...ids);
      } catch (error) {
        console.error('[rocket-meals-module] marking app feedbacks without chat as resolved failed', error);
        result.failedIds.push(...ids);
      }
    }
    return result;
  }

  /** Marks a feedback without chat as done or opens it again – its status lives in `app_feedbacks.state`. */
  static async setResolvedWithoutChat(api: SupportChatApiClient, feedback: Pick<AppFeedbackListItem, 'id'>, resolved: boolean): Promise<void> {
    await api.patch(`${AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT}/${feedback.id}`, { state: resolved ? AppFeedbackState.CLOSED : AppFeedbackState.OPEN });
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
