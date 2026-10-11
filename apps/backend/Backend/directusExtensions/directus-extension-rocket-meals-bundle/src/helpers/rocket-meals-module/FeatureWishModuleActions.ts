/**
 * FeatureWishModuleActions.ts – the writes of the page "Feature-Wünsche": decide on wishes (publish,
 * archive, back to review, merge into an original, take over the AI suggestion – also several at
 * once), set the progress and the notes, and write to the author in a chat.
 *
 * Only the fields are written; the `feature-wishes-hook` does the rest: it clears `related_to` when
 * a wish gets another decision, follows merge chains, recounts the likes and pushes the author when
 * the wish is published.
 *
 * The chat of a wish is only created with the first message (like a chat started from a profile),
 * so the author never sees an empty chat in the app.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FeatureWishStatus } from 'repo-depkit-common/src/FeatureWishHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { AppExtensionLanguageHelper } from '../app-extensions/AppExtensionLanguageHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { ChatQueryHelper } from './ChatQueryHelper';
import { FeatureWishModuleHelper, type FeatureWishListItem } from './FeatureWishModuleHelper';
import { ProfileDetailsHelper } from './ProfileDetailsHelper';
import { SupportChatActions, type SupportChatApiClient } from './SupportChatActions';

/** Which wishes were updated and which failed. */
export type FeatureWishUpdateResult = { updatedIds: string[]; failedIds: string[] };

/** The notes of a wish: the public one is shown in the app, the internal one only here. */
export type FeatureWishNotes = { moderation_note_public: string | null; moderation_note_intern: string | null };

export class FeatureWishModuleActions {
  /** The chat title the author sees in the app, in the language of their profile. */
  static getChatAlias(wish: Pick<FeatureWishListItem, 'id' | 'title' | 'profile'>): string {
    const language = ProfileDetailsHelper.getLanguageCode(FeatureWishModuleHelper.getProfile(wish));
    return AppExtensionLanguageHelper.translate(BackendTranslationKeys.rocket_meals_module_feature_wish_chat_alias, language, { title: FeatureWishModuleHelper.getTitle(wish) ?? wish.id });
  }

  /** Sets the same status on all wishes in one request. */
  static async setStatus(api: SupportChatApiClient, wishes: readonly Pick<FeatureWishListItem, 'id'>[], status: FeatureWishStatus): Promise<FeatureWishUpdateResult> {
    const ids = wishes.map(wish => wish.id);
    if (ids.length === 0) {
      return { updatedIds: [], failedIds: [] };
    }
    try {
      await api.patch(FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, { keys: ids, data: { status } });
      return { updatedIds: ids, failedIds: [] };
    } catch (error) {
      console.error('[rocket-meals-module] updating the status of feature wishes failed', error);
      return { updatedIds: [], failedIds: ids };
    }
  }

  /** Marks a wish as a duplicate of a published original – its likes count for the original from now on. */
  static async merge(api: SupportChatApiClient, wish: Pick<FeatureWishListItem, 'id'>, originalId: string): Promise<void> {
    if (originalId === wish.id) {
      throw new Error('a feature wish cannot be merged into itself');
    }
    await api.patch(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${wish.id}`, { status: FeatureWishStatus.MERGED, related_to: originalId });
  }

  /**
   * Takes over what the AI suggested. Publish and archive go in one request each, a merge keeps the
   * original the AI chose. Wishes without a suggestion that can be taken over are reported as failed.
   */
  static async acceptSuggestions(api: SupportChatApiClient, wishes: readonly FeatureWishListItem[]): Promise<FeatureWishUpdateResult> {
    const result: FeatureWishUpdateResult = { updatedIds: [], failedIds: [] };
    const byStatus = new Map<FeatureWishStatus, FeatureWishListItem[]>();
    for (const wish of wishes) {
      const suggestion = FeatureWishModuleHelper.getSuggestion(wish);
      if (!suggestion || !FeatureWishModuleHelper.canAcceptSuggestion(wish)) {
        result.failedIds.push(wish.id);
        continue;
      }
      byStatus.set(suggestion.acceptStatus, [...(byStatus.get(suggestion.acceptStatus) ?? []), wish]);
    }

    // Sequential on purpose: one PATCH after the other, so a large selection does not fire dozens of
    // parallel requests at the Directus API, and updatedIds/failedIds keep the order of the selection.
    for (const [status, group] of byStatus) {
      if (status !== FeatureWishStatus.MERGED) {
        const groupResult = await FeatureWishModuleActions.setStatus(api, group, status); // NOSONAR S9382 - sequential on purpose, see comment above
        result.updatedIds.push(...groupResult.updatedIds);
        result.failedIds.push(...groupResult.failedIds);
        continue;
      }
      for (const wish of group) {
        try {
          await FeatureWishModuleActions.merge(api, wish, FeatureWishModuleHelper.getRelatedToId(wish)!); // NOSONAR S9382 - sequential on purpose, see comment above the loop
          result.updatedIds.push(wish.id);
        } catch (error) {
          console.error('[rocket-meals-module] merging a feature wish failed', error);
          result.failedIds.push(wish.id);
        }
      }
    }
    return result;
  }

  static async setProgress(api: SupportChatApiClient, wish: Pick<FeatureWishListItem, 'id'>, progress: string | null): Promise<void> {
    await api.patch(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${wish.id}`, { progress });
  }

  /** Saves both notes; empty text clears a note. */
  static async setNotes(api: SupportChatApiClient, wish: Pick<FeatureWishListItem, 'id'>, notes: { public?: string | null; intern?: string | null }): Promise<FeatureWishNotes> {
    const data: FeatureWishNotes = {
      moderation_note_public: notes.public?.trim() || null,
      moderation_note_intern: notes.intern?.trim() || null,
    };
    await api.patch(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${wish.id}`, data);
    return data;
  }

  /**
   * Writes to the author: the first message creates the chat (title in the language of the author),
   * adds the author as participant and links the chat to the wish. Afterwards the chat waits for the
   * user. Returns the id of the chat.
   */
  static async sendMessage(api: SupportChatApiClient, wish: FeatureWishListItem, message: string): Promise<string> {
    let chatId = RelationHelper.getId(wish.chat);
    if (!chatId) {
      const profileId = RelationHelper.getId(wish.profile);
      if (!profileId) {
        throw new Error('feature wish has no profile');
      }
      const chatResponse = await api.post(ChatQueryHelper.CHATS_ENDPOINT, ChatHelper.buildSupportChat({ alias: FeatureWishModuleActions.getChatAlias(wish), initialMessage: FeatureWishModuleActions.getChatInitialMessage(wish) }));
      chatId = String(chatResponse.data?.data?.id);
      await api.post(ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT, ChatHelper.buildParticipant(chatId, profileId));
      await api.patch(`${FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT}/${wish.id}`, { chat: chatId });
    }
    await api.post(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { chat: chatId, message });
    // Set explicitly as well: the hook only recognises support by the app access of the writer.
    await SupportChatActions.setConversationState(api, chatId, ChatHelper.getConversationStateAfterMessage(true));
    return chatId;
  }

  /** The wish as the author wrote it, so both sides see what the chat is about. */
  static getChatInitialMessage(wish: Pick<FeatureWishListItem, 'title' | 'description'>): string {
    return [FeatureWishModuleHelper.getTitle(wish), FeatureWishModuleHelper.getDescription(wish)].filter(part => !!part).join('\n\n');
  }
}
