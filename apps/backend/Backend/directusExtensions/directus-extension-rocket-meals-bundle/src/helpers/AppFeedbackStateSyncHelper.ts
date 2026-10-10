import { AppFeedbackChatStatusHelper, CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { PrimaryKey } from '@directus/types';
import { ItemsServiceHelper } from './ItemsServiceHelper';
import { MyDatabaseHelper } from './MyDatabaseHelper';

/**
 * Keeps `app_feedbacks.state` and `chats.conversation_state` of the linked chat in sync, in both
 * directions: the module "Rocket Meals" and exports only look at the feedback, the app only at
 * the chat.
 *
 * Every write is skipped when the other side already has the value. That ends the ping-pong of
 * the two update hooks (`chat-conversation-state-hook` → `app-feedbacks-hook` → …) after one round.
 */
export class AppFeedbackStateSyncHelper {
  /** The chats changed their state: every app feedback linked to them takes it over. */
  static async syncFeedbacksFromChats(myDatabaseHelper: MyDatabaseHelper, chatIds: PrimaryKey[], conversationState: string | null | undefined): Promise<void> {
    const state = AppFeedbackChatStatusHelper.getStateForConversationState(conversationState);
    if (!state || chatIds.length === 0) {
      return;
    }
    const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();
    const feedbacks = await appFeedbacksHelper.readByQuery({
      filter: { _and: [{ chat: { _in: chatIds } }, { _or: [{ state: { _null: true } }, { state: { _neq: state } }] }] },
      fields: ['id'],
      limit: -1,
    });
    if (feedbacks.length === 0) {
      return;
    }
    await appFeedbacksHelper.updateManyByPrimaryKeys(
      feedbacks.map(feedback => feedback.id),
      { state }
    );
  }

  /** The feedbacks changed their state: their chats take it over. An open feedback leaves its chat as it is. */
  static async syncChatsFromFeedbacks(myDatabaseHelper: MyDatabaseHelper, feedbackIds: PrimaryKey[], state: string | null | undefined): Promise<void> {
    const conversationState = AppFeedbackChatStatusHelper.getConversationStateForState(state);
    if (!conversationState || feedbackIds.length === 0) {
      return;
    }
    const feedbacks = await myDatabaseHelper.getAppFeedbacksHelper().readByQuery({
      filter: { id: { _in: feedbackIds } },
      fields: ['id', 'chat.id', 'chat.conversation_state'],
      limit: -1,
    });
    const chatIds = feedbacks
      .map(feedback => feedback.chat)
      .filter((chat): chat is DatabaseTypes.Chats => typeof chat === 'object' && chat !== null && chat.conversation_state !== conversationState)
      .map(chat => ItemsServiceHelper.getPrimaryKeyFromItemOrString(chat))
      .filter((chatId): chatId is PrimaryKey => chatId !== undefined);
    if (chatIds.length === 0) {
      return;
    }
    const chatsHelper = new ItemsServiceHelper<DatabaseTypes.Chats>(myDatabaseHelper, CollectionNames.CHATS);
    await chatsHelper.updateManyByPrimaryKeys(Array.from(new Set(chatIds)), { conversation_state: conversationState });
  }
}
