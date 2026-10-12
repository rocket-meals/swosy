/**
 * Vue composable for lists of chats that can be marked as done (page "Chats", chats of a profile):
 * chats that are not done yet can be selected and marked as done one by one or several at once.
 * Only usable inside a component `setup`.
 *
 * - Only chats that are not done can be selected, the selection keeps only those that still are.
 * - The ids being updated are tracked, so a chat is never sent twice and its buttons show a spinner.
 */

import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, ref, watch, type Ref } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper, type ModuleChat } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { SupportChatActions } from '../../helpers/rocket-meals-module/SupportChatActions';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

export function useChatResolveSelection(chats: Readonly<Ref<ModuleChat[]>>, reload: () => Promise<void>) {
  const api = useApi();
  const { useNotificationsStore } = useStores();
  const notificationsStore = useNotificationsStore();
  const { translate } = useAppExtensionTranslate();

  const selectedIds = ref<string[]>([]);
  const updatingIds = ref<string[]>([]);

  const selectableChats = computed(() => chats.value.filter(ChatQueryHelper.canMarkResolved));
  const selectedChats = computed(() => selectableChats.value.filter(chat => selectedIds.value.includes(chat.id)));
  const allSelected = computed(() => selectableChats.value.length > 0 && selectedChats.value.length === selectableChats.value.length);
  const someSelected = computed(() => selectedChats.value.length > 0 && !allSelected.value);

  // Keep only selections that are still visible and can be marked.
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

  /** Marks chats as done, then reloads the list. Marked chats leave the selection. */
  async function markResolved(chatsToResolve: readonly ModuleChat[]) {
    const pendingIds = chatsToResolve.filter(chat => !isUpdating(chat)).map(chat => chat.id);
    if (pendingIds.length === 0) {
      return;
    }
    updatingIds.value = [...updatingIds.value, ...pendingIds];
    try {
      const result = await SupportChatActions.markChatsResolved(api, pendingIds);
      selectedIds.value = selectedIds.value.filter(id => !result.resolvedIds.includes(id));
      if (result.failedIds.length > 0) {
        notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_mark_resolved_failed), type: 'error' });
      }
    } finally {
      updatingIds.value = updatingIds.value.filter(id => !pendingIds.includes(id));
      await reload();
    }
  }

  return { selectableChats, selectedChats, allSelected, someSelected, isSelected, toggleSelected, toggleSelectAll, isUpdating, markResolved };
}
