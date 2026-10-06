/**
 * FoodFeedbackChatActions.ts – the writes of the page "Speise-Feedbacks": create the chat of a
 * feedback and set its state. Shared by the list (mark as done, also for several at once) and the
 * chat page, so both create chats the same way.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { AppExtensionLanguageHelper } from '../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { FoodFeedbackChatHelper, type FoodFeedbackListItem } from './FoodFeedbackChatHelper';

/** The part of the Directus app's axios instance used here. */
export type FoodFeedbackApiClient = {
  post: (url: string, data?: unknown) => Promise<{ data?: any }>;
  patch: (url: string, data?: unknown) => Promise<{ data?: any }>;
};

export type MarkResolvedResult = { resolvedIds: string[]; failedIds: string[] };

export class FoodFeedbackChatActions {
  /**
   * The chat of a feedback; on first use it is created, the author added as participant and the
   * chat linked to the feedback, so the author finds it in the app.
   */
  static async ensureChat(api: FoodFeedbackApiClient, feedback: FoodFeedbackListItem): Promise<string> {
    const existingChatId = RelationHelper.getId(feedback.chat);
    if (existingChatId) {
      return String(existingChatId);
    }
    const profileId = RelationHelper.getId(feedback.profile);
    if (!profileId) {
      throw new Error('feedback has no profile');
    }
    // The author sees the chat title in the app, so it is written in the author's language.
    const authorLanguage = FoodFeedbackChatStatusHelper.getAuthorLanguage(feedback);
    const food = FoodFeedbackChatHelper.getFoodName(feedback) || AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_unknown_food, authorLanguage);
    const alias = AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_food_feedback_chat_alias, authorLanguage, { food });

    const chatResponse = await api.post(FoodFeedbackChatHelper.CHATS_ENDPOINT, FoodFeedbackChatStatusHelper.buildChatForFeedback(feedback, alias));
    const createdChatId = String(chatResponse.data?.data?.id);
    await api.post(FoodFeedbackChatHelper.CHATS_PARTICIPANTS_ENDPOINT, ChatHelper.buildParticipant(createdChatId, profileId));
    await api.patch(`${FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT}/${feedback.id}`, { chat: createdChatId });
    return createdChatId;
  }

  static async setConversationState(api: FoodFeedbackApiClient, chatId: string, state: ChatConversationState): Promise<void> {
    await api.patch(`${FoodFeedbackChatHelper.CHATS_ENDPOINT}/${chatId}`, { conversation_state: state });
  }

  /**
   * Marks feedbacks as done. Existing chats are updated in one request; a feedback without chat
   * gets one first (the status lives in `chats.conversation_state`) – its author then sees the
   * chat, opened by their own comment, as done in the app. Feedbacks that cannot be marked (no
   * profile) or fail are reported in `failedIds`.
   */
  static async markResolved(api: FoodFeedbackApiClient, feedbacks: readonly FoodFeedbackListItem[]): Promise<MarkResolvedResult> {
    const resolvedIds: string[] = [];
    const failedIds: string[] = [];
    const existingChats: { feedbackId: string; chatId: string }[] = [];
    const withoutChat: FoodFeedbackListItem[] = [];

    for (const feedback of feedbacks) {
      const chatId = RelationHelper.getId(feedback.chat);
      if (chatId) {
        existingChats.push({ feedbackId: feedback.id, chatId: String(chatId) });
      } else if (FoodFeedbackChatStatusHelper.canStartChat(feedback)) {
        withoutChat.push(feedback);
      } else {
        failedIds.push(feedback.id);
      }
    }

    if (existingChats.length > 0) {
      try {
        await api.patch(FoodFeedbackChatHelper.CHATS_ENDPOINT, {
          keys: existingChats.map(entry => entry.chatId),
          data: { conversation_state: ChatConversationState.RESOLVED },
        });
        resolvedIds.push(...existingChats.map(entry => entry.feedbackId));
      } catch (error) {
        console.error('[rocket-meals-module] marking chats as resolved failed', error);
        failedIds.push(...existingChats.map(entry => entry.feedbackId));
      }
    }

    for (const feedback of withoutChat) {
      try {
        const chatId = await FoodFeedbackChatActions.ensureChat(api, feedback);
        await FoodFeedbackChatActions.setConversationState(api, chatId, ChatConversationState.RESOLVED);
        resolvedIds.push(feedback.id);
      } catch (error) {
        console.error('[rocket-meals-module] marking food feedback as resolved failed', error);
        failedIds.push(feedback.id);
      }
    }

    return { resolvedIds, failedIds };
  }
}
