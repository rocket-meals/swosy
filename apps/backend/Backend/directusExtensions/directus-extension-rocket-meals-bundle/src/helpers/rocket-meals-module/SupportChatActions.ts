/**
 * SupportChatActions.ts – the writes every feedback page of the module `Rocket Meals` shares: set
 * the state of a support chat, mark feedbacks as done (also several at once). What a chat looks
 * like when it is created differs per feedback kind and is passed in as `ensureChat`
 * (`FoodFeedbackChatActions`, `AppFeedbackChatActions`).
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { RelationHelper, type RelationValue } from 'repo-depkit-common/src/RelationHelper';

/** The part of the Directus app's axios instance used here. */
export type SupportChatApiClient = {
  post: (url: string, data?: unknown) => Promise<{ data?: any }>;
  patch: (url: string, data?: unknown) => Promise<{ data?: any }>;
};

export type MarkResolvedResult = { resolvedIds: string[]; failedIds: string[] };

/** A feedback with a support chat, as the pages load it. */
export type FeedbackWithSupportChat = { id: string; chat?: RelationValue | { id: string; conversation_state?: string | null } };

export class SupportChatActions {
  static readonly CHATS_ENDPOINT = `/items/${CollectionNames.CHATS}`;

  static async setConversationState(api: SupportChatApiClient, chatId: string, state: ChatConversationState): Promise<void> {
    await api.patch(`${SupportChatActions.CHATS_ENDPOINT}/${chatId}`, { conversation_state: state });
  }

  /**
   * Marks feedbacks as done. Existing chats are updated in one request; a feedback without chat
   * gets one first via `ensureChat` (the status lives in `chats.conversation_state`) – its author
   * then sees the chat as done in the app. Feedbacks that cannot be marked (`canStartChat` false)
   * or fail are reported in `failedIds`.
   */
  static async markResolved<T extends FeedbackWithSupportChat>(
    api: SupportChatApiClient,
    feedbacks: readonly T[],
    options: { canStartChat: (feedback: T) => boolean; ensureChat: (api: SupportChatApiClient, feedback: T) => Promise<string> }
  ): Promise<MarkResolvedResult> {
    const resolvedIds: string[] = [];
    const failedIds: string[] = [];
    const existingChats: { feedbackId: string; chatId: string }[] = [];
    const withoutChat: T[] = [];

    for (const feedback of feedbacks) {
      const chatId = RelationHelper.getId(feedback.chat as RelationValue);
      if (chatId) {
        existingChats.push({ feedbackId: feedback.id, chatId });
      } else if (options.canStartChat(feedback)) {
        withoutChat.push(feedback);
      } else {
        failedIds.push(feedback.id);
      }
    }

    if (existingChats.length > 0) {
      try {
        await api.patch(SupportChatActions.CHATS_ENDPOINT, {
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
        const chatId = await options.ensureChat(api, feedback);
        await SupportChatActions.setConversationState(api, chatId, ChatConversationState.RESOLVED);
        resolvedIds.push(feedback.id);
      } catch (error) {
        console.error('[rocket-meals-module] marking feedback as resolved failed', error);
        failedIds.push(feedback.id);
      }
    }

    return { resolvedIds, failedIds };
  }
}
