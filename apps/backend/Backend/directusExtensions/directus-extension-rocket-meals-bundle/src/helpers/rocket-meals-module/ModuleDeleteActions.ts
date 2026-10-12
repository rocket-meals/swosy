/**
 * ModuleDeleteActions.ts – deleting items from the pages of the module `Rocket Meals` (food
 * feedbacks, app feedbacks, feature wishes, chats), several at once or one from its detail page.
 *
 * A feedback or wish takes its support chat with it: otherwise the chat would stay without its item
 * and show up on the page "Chats". The messages of a chat are deleted by the database (cascade), its
 * participants are deleted here, the relation would only empty them. Likes and duplicates of a
 * feature wish are deleted by the `feature-wishes-hook`.
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { RelationHelper, type RelationValue } from 'repo-depkit-common/src/RelationHelper';
import { ChatQueryHelper } from './ChatQueryHelper';

/** The part of the Directus app's axios instance used here. */
export type ModuleDeleteApiClient = {
  delete: (url: string, config?: { data?: unknown }) => Promise<unknown>;
};

/** An item that may have a support chat. */
export type ModuleDeletableItem = { id: string; chat?: RelationValue };

export type ModuleDeleteResult = { deletedIds: string[]; failedIds: string[] };

export class ModuleDeleteActions {
  /** The ids of the chats of the items, without duplicates. */
  static getChatIds(items: readonly ModuleDeletableItem[]): string[] {
    const chatIds = items.map(item => RelationHelper.getId(item.chat)).filter((id): id is string => !!id);
    return [...new Set(chatIds)];
  }

  /**
   * Deletes the items of a collection in one request, then their chats. When the items cannot be
   * deleted, all of them are reported in `failedIds` and no chat is touched. A chat that cannot be
   * deleted afterwards is only logged: its item is gone already.
   */
  static async deleteItems(api: ModuleDeleteApiClient, endpoint: string, items: readonly ModuleDeletableItem[]): Promise<ModuleDeleteResult> {
    const ids = items.map(item => item.id);
    if (ids.length === 0) {
      return { deletedIds: [], failedIds: [] };
    }
    try {
      await api.delete(endpoint, { data: ids });
    } catch (error) {
      console.error('[rocket-meals-module] deleting items failed', error);
      return { deletedIds: [], failedIds: ids };
    }
    const chatIds = ModuleDeleteActions.getChatIds(items);
    if (chatIds.length > 0) {
      const chatResult = await ModuleDeleteActions.deleteChats(api, chatIds);
      if (chatResult.failedIds.length > 0) {
        console.error('[rocket-meals-module] the chats of deleted items could not be deleted', chatResult.failedIds);
      }
    }
    return { deletedIds: ids, failedIds: [] };
  }

  /** Deletes chats with their participants (and, by the database, their messages). */
  static async deleteChats(api: ModuleDeleteApiClient, chatIds: readonly string[]): Promise<ModuleDeleteResult> {
    if (chatIds.length === 0) {
      return { deletedIds: [], failedIds: [] };
    }
    try {
      await api.delete(ChatQueryHelper.CHATS_PARTICIPANTS_ENDPOINT, { data: { query: { filter: { chats_id: { _in: [...chatIds] } } } } });
      await api.delete(ChatQueryHelper.CHATS_ENDPOINT, { data: [...chatIds] });
      return { deletedIds: [...chatIds], failedIds: [] };
    } catch (error) {
      console.error('[rocket-meals-module] deleting chats failed', error);
      return { deletedIds: [], failedIds: [...chatIds] };
    }
  }
}
