/**
 * Vue composable for lists of chats (page "Chats", chats of a profile): chats can be selected, then
 * marked as done (those not done yet) or deleted, one by one or several at once.
 * Only usable inside a component `setup`.
 *
 * - The selection keeps only chats that are still listed.
 * - The ids being updated are tracked, so a chat is never sent twice and its buttons show a spinner.
 */

import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, ref, watch, type Ref } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper, type ModuleChat } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { ModuleDeleteActions } from '../../helpers/rocket-meals-module/ModuleDeleteActions';
import { SupportChatActions } from '../../helpers/rocket-meals-module/SupportChatActions';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

export function useChatSelection(chats: Readonly<Ref<ModuleChat[]>>, reload: () => Promise<void>) {
  const api = useApi();
  const { useNotificationsStore } = useStores();
  const notificationsStore = useNotificationsStore();
  const { translate } = useAppExtensionTranslate();

  const selectedIds = ref<string[]>([]);
  const updatingIds = ref<string[]>([]);

  const selectableChats = computed(() => chats.value);
  const selectedChats = computed(() => selectableChats.value.filter(chat => selectedIds.value.includes(chat.id)));
  /** Marking as done only applies to the selected chats that are not done yet. */
  const selectedToResolve = computed(() => selectedChats.value.filter(ChatQueryHelper.canMarkResolved));
  const allSelected = computed(() => selectableChats.value.length > 0 && selectedChats.value.length === selectableChats.value.length);
  const someSelected = computed(() => selectedChats.value.length > 0 && !allSelected.value);

  // Keep only selections that are still listed.
  watch(selectableChats, selectable => {
    selectedIds.value = selectedIds.value.filter(id => selectable.some(chat => chat.id === id));
  });

  function isSelected(chat: ModuleChat) {
    return selectedIds.value.includes(chat.id);
  }

  function toggleSelected(chat: ModuleChat, selected: boolean) {
    const others = selectedIds.value.filter(id => id !== chat.id);
    selectedIds.value = selected ? [...others, chat.id] : others;
  }

  function toggleSelectAll(selected: boolean) {
    selectedIds.value = selected ? selectableChats.value.map(chat => chat.id) : [];
  }

  function isUpdating(chat: ModuleChat) {
    return updatingIds.value.includes(chat.id);
  }

  /** Runs an update on the chats not being updated already, then reloads the list. Updated chats leave the selection. */
  async function runUpdate(chatsToUpdate: readonly ModuleChat[], update: (chatIds: string[]) => Promise<{ failedIds: string[] }>, failedTitleKey: BackendTranslationKeys) {
    const pendingIds = chatsToUpdate.filter(chat => !isUpdating(chat)).map(chat => chat.id);
    if (pendingIds.length === 0) {
      return;
    }
    updatingIds.value = [...updatingIds.value, ...pendingIds];
    try {
      const result = await update(pendingIds);
      selectedIds.value = selectedIds.value.filter(id => !pendingIds.includes(id) || result.failedIds.includes(id));
      if (result.failedIds.length > 0) {
        notificationsStore.add({ title: translate(failedTitleKey), type: 'error' });
      }
    } finally {
      updatingIds.value = updatingIds.value.filter(id => !pendingIds.includes(id));
      await reload();
    }
  }

  /** Marks chats as done. */
  function markResolved(chatsToResolve: readonly ModuleChat[]) {
    return runUpdate(chatsToResolve, chatIds => SupportChatActions.markChatsResolved(api, chatIds), BackendTranslationKeys.rocket_meals_module_mark_resolved_failed);
  }

  /** Deletes chats with their participants and messages. */
  function deleteChats(chatsToDelete: readonly ModuleChat[]) {
    return runUpdate(chatsToDelete, chatIds => ModuleDeleteActions.deleteChats(api, chatIds), BackendTranslationKeys.rocket_meals_module_delete_failed);
  }

  return { selectableChats, selectedChats, selectedToResolve, allSelected, someSelected, isSelected, toggleSelected, toggleSelectAll, isUpdating, markResolved, deleteChats };
}
