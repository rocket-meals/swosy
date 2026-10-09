<script setup lang="ts">
/**
 * Page "Chats": the newest chats that belong to no food or app feedback (those have their own
 * pages), e.g. the ones support started from a profile. Each row shows who takes part, the status
 * and the last message. A new chat is started from a profile, so the button leads to the search.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';
import { FoodFeedbackChatFilter } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ChatQueryHelper, type ModuleChat, type ModuleChatMessage } from '../../helpers/rocket-meals-module/ChatQueryHelper';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';
import ProfileAvatar from '../profiles/profile-avatar.vue';

const api = useApi();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.CHATS;

const activeFilter = ref<FoodFeedbackChatFilter>(FoodFeedbackChatFilter.OPEN);
const search = ref('');
const chats = ref<ModuleChat[]>([]);
/** The newest message per chat id – the preview of a row. */
const latestMessages = ref<Record<string, ModuleChatMessage | undefined>>({});
const total = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const loadError = ref(false);
const pageCount = computed(() => ChatQueryHelper.getPageCount(total.value));

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
  searchTimer = setTimeout(reloadFromFirstPage, 300);
});
watch(activeFilter, reloadFromFirstPage);
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
      <div class="search">
        <v-input v-model="search" type="search" small :placeholder="translate(BackendTranslationKeys.search)">
          <template #prepend><v-icon name="search" small /></template>
        </v-input>
      </div>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_chat_new)" rounded icon :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES)">
        <v-icon name="add" />
      </v-button>
    </template>

    <div class="chats">
      <div class="filters">
        <button v-for="filter in ChatQueryHelper.STATUS_FILTERS" :key="filter" class="filter" :class="{ active: activeFilter === filter }" @click="activeFilter = filter">
          {{ translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)) }}
        </button>
      </div>

      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div v-else-if="!loading && chats.length === 0" class="empty type-note">
        <p>{{ translate(BackendTranslationKeys.rocket_meals_module_chats_empty) }}</p>
        <v-button secondary :to="RocketMealsModulePages.getRoute(RocketMealsModulePages.PROFILES)">
          <v-icon name="person_search" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_chat_new) }}
        </v-button>
      </div>

      <div v-else class="list" :class="{ loading }">
        <router-link v-for="chat in chats" :key="chat.id" class="chat" :to="ChatQueryHelper.getRoute(chat)">
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
          </div>
        </router-link>
      </div>

      <div v-if="pageCount > 1" class="pagination">
        <v-pagination v-model="currentPage" :length="pageCount" :total-visible="7" show-first-last />
      </div>
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

.search {
  inline-size: 16rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter {
  padding: 0.375rem 0.875rem;
  color: var(--theme--foreground);
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 2rem;
  cursor: pointer;
}

.filter.active {
  color: var(--foreground-inverted, #fff);
  background: var(--theme--primary);
  border-color: var(--theme--primary);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: opacity var(--fast) var(--transition);
}

.list.loading {
  opacity: 0.6;
}

.chat {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  color: inherit;
  text-decoration: none;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  transition: border-color var(--fast) var(--transition);
}

.chat:hover,
.chat:focus-visible {
  border-color: var(--theme--primary);
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

.empty {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  padding: 2rem 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
}

.spacer {
  flex: 1;
}
</style>
