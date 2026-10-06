import { ChatConversationState } from './ChatConversationState';
import { RelationHelper, type RelationValue } from './RelationHelper';

/** Just the fields of a `chat_messages` row the chat logic looks at. */
export type ChatMessageLike = {
  profile?: RelationValue;
  date_created?: string | null;
  date_updated?: string | null;
};

/**
 * Rules of the support chats (`chats`, `chat_messages`, `chats_participants`), shared by the apps,
 * the Directus hooks and the backend module "Rocket Meals":
 *
 * - **Who wrote a message:** app users always send their `profile` with a message; support writes
 *   from the Directus backend without one. A message without profile is therefore from support.
 * - **State of a conversation** (`chats.conversation_state`): after a support message the chat waits
 *   for the user, after a user message it waits for support. `resolved` is only ever set by hand.
 * - **Shape of a new support chat:** the same for app feedbacks and food feedbacks, so the apps
 *   show both the same way.
 */
export class ChatHelper {
  /** A message without profile was written by support in the backend. */
  static isSupportMessage(message: Pick<ChatMessageLike, 'profile'>): boolean {
    return !RelationHelper.isSet(message.profile);
  }

  /** The conversation state a chat is in after a new message. */
  static getConversationStateAfterMessage(messageFromSupport: boolean): ChatConversationState {
    return messageFromSupport ? ChatConversationState.WAITING_FOR_USER : ChatConversationState.WAITING_FOR_SUPPORT;
  }

  /** Messages oldest first, so a conversation reads top to bottom. Does not modify the input. */
  static sortMessagesChronologically<T extends ChatMessageLike>(messages: readonly T[]): T[] {
    const timestamp = (message: T) => message.date_created || message.date_updated || '';
    return [...messages].sort((a, b) => {
      const timestampA = timestamp(a);
      const timestampB = timestamp(b);
      if (timestampA === timestampB) {
        return 0;
      }
      return timestampA < timestampB ? -1 : 1;
    });
  }

  /**
   * A new support chat: `alias` is its title in the app, `initialMessage` the request that opens it
   * (the feedback text). It starts waiting for support – nobody has answered yet.
   */
  static buildSupportChat(options: { alias: string; initialMessage?: string | null }) {
    return {
      alias: options.alias,
      initial_message: options.initialMessage?.trim() || null,
      conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
    };
  }

  /** The `chats_participants` row that lets a profile see a chat in the app. */
  static buildParticipant(chatId: string, profileId: string) {
    return { chats_id: chatId, profiles_id: profileId };
  }
}
