<script setup lang="ts">
/**
 * Page "Chats": the newest chats that belong to no food or app feedback (those have their own
 * pages), e.g. the ones support started from a profile. Each row shows who takes part, the status
 * and the last message. A new chat is started from a profile, so the button leads to the search.
 * Chats can be marked as done right from the list – one by one or several selected at once.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FoodFeedbackChatFilter } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper, type ModuleChat, type ModuleChatMessage } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useChatResolveSelection } from '../composables/useChatResolveSelection';
import ModuleNavigation from '../module-navigation.vue';
import ListContent from '../module-list/list-content.vue';
import ListPagination from '../module-list/list-pagination.vue';
import ListRow from '../module-list/list-row.vue';
import ListSearchActions from '../module-list/list-search-actions.vue';
import ListSelectionBar from '../module-list/list-selection-bar.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';
import ProfileAvatar from '../profiles/profile-avatar.vue';

const api = useApi();
const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.CHATS;

/** The status chip is remembered per browser, so the page opens again as it was left. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('chats');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<{ statusFilter: FoodFeedbackChatFilter }>(settingsStorage, SETTINGS_STORAGE_KEY);

const activeFilter = ref<FoodFeedbackChatFilter>(ModuleListHelper.pickAllowed(storedSettings.statusFilter, ChatQueryHelper.STATUS_FILTERS, FoodFeedbackChatFilter.OPEN));
const search = ref('');
const chats = ref<ModuleChat[]>([]);
/** The newest message per chat id – the preview of a row. */
const latestMessages = ref<Record<string, ModuleChatMessage | undefined>>({});
const total = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const loadError = ref(false);
const pageCount = computed(() => ModuleListHelper.getPageCount(total.value, ChatQueryHelper.PAGE_SIZE));
const { selectableChats, selectedChats, allSelected, someSelected, isSelected, toggleSelected, toggleSelectAll, isUpdating, markResolved } = useChatResolveSelection(chats, load);
const statusChips = computed(() => ChatQueryHelper.STATUS_FILTERS.map(filter => ({ value: filter, label: translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)) })));

async function loadLatestMessages(chatIds: string[]) {
  const entries = await Promise.all(
    chatIds.map(async chatId => {
      try {
        const response = await api.get(ChatQueryHelper.CHAT_MESSAGES_ENDPOINT, { params: ChatQueryHelper.buildLatestMessageQuery(chatId) });
        return [chatId, (response.data?.data ?? [])[0] as ModuleChatMessage | undefined] as const;
      } catch {
        return [chatId, undefined] as const;
      }
    })
  );
  latestMessages.value = Object.fromEntries(entries);
}

let requestCounter = 0;

async function load() {
  const request = ++requestCounter;
  loading.value = true;
  try {
    const response = await api.get(ChatQueryHelper.CHATS_ENDPOINT, {
      params: ChatQueryHelper.buildChatsQuery({ withoutFeedbackChats: true, status: activeFilter.value, search: search.value, page: currentPage.value }),
    });
    if (request !== requestCounter) {
      return;
    }
    chats.value = response.data?.data ?? [];
    total.value = Number(response.data?.meta?.filter_count ?? chats.value.length);
    loadError.value = false;
    await loadLatestMessages(chats.value.map(chat => chat.id));
  } catch (error) {
    console.error('[rocket-meals-module] loading chats failed', error);
    if (request === requestCounter) {
      loadError.value = true;
    }
  } finally {
    if (request === requestCounter) {
      loading.value = false;
    }
  }
}

function previewAuthor(message: ModuleChatMessage | undefined): string {
  if (!message) {
    return '';
  }
  if (ChatHelper.isSupportMessage(message)) {
    return translate(BackendTranslationKeys.rocket_meals_module_support);
  }
  return FoodFeedbackChatHelper.getNickname(message.profile) ?? translate(BackendTranslationKeys.rocket_meals_module_user);
}

function reloadFromFirstPage() {
  if (currentPage.value === 1) {
    load();
  } else {
    currentPage.value = 1;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(reloadFromFirstPage, ModuleListHelper.SEARCH_DEBOUNCE_MS);
});
watch(activeFilter, reloadFromFirstPage);
watch(activeFilter, () => ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { statusFilter: activeFilter.value }));
watch(currentPage, load);
onMounted(load);
</script>

<template>
  <private-view :title="translate(page.labelKey)" :icon="page.icon">
    <template #headline>
      <v-breadcrumb :items="[{ name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() }]" />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <list-search-actions v-model="search" :loading="loading" @refresh="load">
        <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_chat_new)" rounded icon :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES)">
          <v-icon name="add" />
        </v-button>
      </list-search-actions>
    </template>

    <div class="chats">
      <status-filter-chips v-model="activeFilter" :filters="statusChips" />

      <list-selection-bar v-if="selectableChats.length > 0" :selected-count="selectedChats.length" :all-selected="allSelected" :some-selected="someSelected" @toggle-all="toggleSelectAll">
        <v-button v-if="selectedChats.length > 0" small :loading="selectedChats.some(isUpdating)" @click="markResolved(selectedChats)">
          <v-icon name="task_alt" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_mark_selected_resolved) }}
        </v-button>
      </list-selection-bar>

      <list-content :loading="loading" :load-error="loadError" :empty="chats.length === 0">
        <template #empty>
          <p>{{ translate(BackendTranslationKeys.rocket_meals_module_chats_empty) }}</p>
          <v-button secondary :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES)">
            <v-icon name="person_search" left small />
            {{ translate(BackendTranslationKeys.rocket_meals_module_chat_new) }}
          </v-button>
        </template>
        <list-row v-for="chat in chats" :key="chat.id" :selectable="ChatQueryHelper.canMarkResolved(chat)" :selected="isSelected(chat)" @open="router.push(ChatQueryHelper.getRoute(chat))" @update:selected="toggleSelected(chat, $event)">
          <div class="avatars">
            <profile-avatar v-for="profile in ChatQueryHelper.getProfiles(chat).slice(0, 3)" :key="profile.id" :profile="profile" :size="40" :link="false" />
            <span v-if="ChatQueryHelper.getProfiles(chat).length === 0" class="no-avatar"><v-icon :name="page.icon" /></span>
          </div>
          <div class="chat-content">
            <div class="chat-header">
              <food-feedback-status-chip :status="ChatQueryHelper.getStatus(chat)" />
              <span class="title type-label">{{ chat.alias || translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
              <span class="spacer" />
              <span class="type-note">{{ formatDateTime(chat.date_updated || chat.date_created) }}</span>
            </div>
            <div class="participants type-note">
              {{
                ChatQueryHelper.getProfiles(chat)
                  .map(profile => FoodFeedbackChatHelper.getNickname(profile) ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname))
                  .join(', ')
              }}
            </div>
            <div v-if="latestMessages[chat.id]" class="preview">
              <strong>{{ previewAuthor(latestMessages[chat.id]) }}:</strong>
              {{ latestMessages[chat.id]?.message }}
            </div>
            <div v-if="ChatQueryHelper.canMarkResolved(chat)" class="chat-actions">
              <v-button small secondary :loading="isUpdating(chat)" @click.stop="markResolved([chat])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
              </v-button>
            </div>
          </div>
        </list-row>
      </list-content>

      <list-pagination v-model:page="currentPage" :page-count="pageCount" :total="total" />
    </div>
  </private-view>
</template>

<style scoped>
.chats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-inline-size: 64rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.avatars {
  display: flex;
  flex: none;
}

/* Several participants overlap like a stack. */
.avatars > * + * {
  margin-inline-start: -0.75rem;
}

.no-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 40px;
  block-size: 40px;
  background: var(--theme--background-normal);
  border-radius: 50%;
}

.chat-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  min-inline-size: 0;
}

.chat-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.title {
  overflow-wrap: anywhere;
}

.preview {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
}

.spacer {
  flex: 1;
}

.chat-actions {
  display: flex;
  justify-content: flex-end;
  margin-block-start: 0.25rem;
}
</style>
