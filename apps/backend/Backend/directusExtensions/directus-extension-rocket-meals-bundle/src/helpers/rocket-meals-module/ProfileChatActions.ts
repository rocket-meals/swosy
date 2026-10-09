/**
 * ProfileChatActions.ts – support starts a chat with a profile (page "Chat starten" of a profile).
 *
 * The chat is only created with the first message, so a profile never sees an empty chat in the
 * app: chat (title in the language of the profile), participant, message, then the state "waiting
 * for user" – the same steps the feedback chats take when support answers first.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { AppExtensionLanguageHelper } from '../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { ChatQueryHelper } from './ChatQueryHelper';
import { ProfileDetailsHelper, type ModuleProfile } from './ProfileDetailsHelper';
import { SupportChatActions, type SupportChatApiClient } from './SupportChatActions';

export class ProfileChatActions {
  /** The title of the chat in the app, written in the language of the profile. */
  static getChatAlias(profile: ModuleProfile): string {
    return AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_profile_chat_alias, ProfileDetailsHelper.getLanguageCode(profile));
  }

  /** Creates the chat with the first message and returns its id. */
  static async startChat(api: SupportChatApiClient, profile: ModuleProfile, message: string): Promise<string> {
    const chatResponse = await api.post(ChatQueryHelper.CHATS_ENDPOINT, ChatHelper.buildSupportChat({ alias: ProfileChatActions.getChatAlias(profile) }));
    const chatId = String(chatResponse.data?.data?.id);
    await api.post(ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT, ChatHelper.buildParticipant(chatId, profile.id));
    await api.post(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { chat: chatId, message });
    // Set explicitly as well: the hook only recognises support by the app access of the writer.
    await SupportChatActions.setConversationState(api, chatId, ChatHelper.getConversationStateAfterMessage(true));
    return chatId;
  }

  /** Answers in an existing chat and sets it to "waiting for user". */
  static async sendMessage(api: SupportChatApiClient, chatId: string, message: string): Promise<void> {
    await api.post(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { chat: chatId, message });
    await SupportChatActions.setConversationState(api, chatId, ChatHelper.getConversationStateAfterMessage(true));
  }
}
