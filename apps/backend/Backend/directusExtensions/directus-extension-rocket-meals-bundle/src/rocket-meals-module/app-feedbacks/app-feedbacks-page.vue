<script setup lang="ts">
/**
 * Page "App-Feedbacks": the latest feedbacks on the app – from the feedback form in the app and
 * reviews pulled from the App Store and Google Play – filterable by chat status, source and
 * thumbs up / down, sortable by date. Feedbacks can be marked as done right from the list – one
 * by one or several selected at once, without answering (also store reviews and anonymous ones,
 * e.g. positive feedback). Every row leads to the chat with the author
 * (`app-feedback-chat-page.vue`), store reviews to their public answer.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { AppFeedbackChatActions } from '../../helpers/rocket-meals-module/AppFeedbackChatActions';
import { AppFeedbackChatHelper, AppFeedbackTypeFilter, type AppFeedbackListItem, type AppFeedbackListOptions } from '../../helpers/rocket-meals-module/AppFeedbackChatHelper';
import { FoodFeedbackChatHelper, FoodFeedbackListSort } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from '../food-feedbacks/food-feedback-rating.vue';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.APP_FEEDBACKS;

/** Source, sort and page size are remembered per browser. */
const SETTINGS_STORAGE_KEY = 'rocket-meals-module.app-feedbacks.list-settings';
type StoredListSettings = Pick<AppFeedbackListOptions, 'source' | 'sort' | 'pageSize'>;

function readStoredSettings(): StoredListSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredListSettings) : {};
  } catch {
    return {};
  }
}

function storeSettings(settings: StoredListSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode, blocked) – the settings just are not remembered.
  }
}

const storedSettings = readStoredSettings();

const activeFilter = ref<FoodFeedbackChatFilter>(FoodFeedbackChatFilter.OPEN);
const search = ref('');
const source = ref<AppFeedbackSourceFilter>(storedSettings.source && AppFeedbackChatStatusHelper.SOURCE_FILTERS.includes(storedSettings.source) ? storedSettings.source : AppFeedbackSourceFilter.ALL);
const typeFilter = ref<AppFeedbackTypeFilter>(AppFeedbackTypeFilter.ALL);
const sort = ref<FoodFeedbackListSort>(storedSettings.sort && AppFeedbackChatHelper.SORTS.includes(storedSettings.sort) ? storedSettings.sort : FoodFeedbackListSort.NEWEST);
const pageSize = ref<number>(FoodFeedbackChatHelper.getPageSize(storedSettings.pageSize));
const currentPage = ref(1);
const feedbacks = ref<AppFeedbackListItem[]>([]);
const total = ref(0);
const counts = ref<Partial<Record<FoodFeedbackChatFilter, number>>>({});
const loading = ref(false);
const loadError = ref(false);
const selectedIds = ref<string[]>([]);
const resolvingIds = ref<string[]>([]);

const listOptions = computed<AppFeedbackListOptions>(() => ({
  source: source.value,
  type: typeFilter.value,
  sort: sort.value,
  pageSize: pageSize.value,
}));

const pageCount = computed(() => FoodFeedbackChatHelper.getPageCount(total.value, pageSize.value));
const sourceItems = computed(() => AppFeedbackChatStatusHelper.SOURCE_FILTERS.map(option => ({ text: translate(AppFeedbackChatHelper.getSourceFilterLabelKey(option)), value: option })));
const typeItems = computed(() => AppFeedbackChatHelper.TYPE_FILTERS.map(option => ({ text: translate(AppFeedbackChatHelper.getTypeFilterLabelKey(option)), value: option })));
const sortItems = computed(() => AppFeedbackChatHelper.SORTS.map(option => ({ text: translate(FoodFeedbackChatHelper.getSortLabelKey(option)), value: option })));
const pageSizeItems = FoodFeedbackChatHelper.PAGE_SIZE_OPTIONS.map(size => ({ text: String(size), value: size }));

/** Feedbacks of this page that can be marked as done – only those can be selected. */
const selectableFeedbacks = computed(() => feedbacks.value.filter(AppFeedbackChatHelper.canMarkResolved));
const selectedFeedbacks = computed(() => selectableFeedbacks.value.filter(feedback => selectedIds.value.includes(feedback.id)));
const allSelected = computed(() => selectableFeedbacks.value.length > 0 && selectedFeedbacks.value.length === selectableFeedbacks.value.length);
const someSelected = computed(() => selectedFeedbacks.value.length > 0 && !allSelected.value);

let latestRequest = 0;

async function loadFeedbacks() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const response = await api.get(AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, {
      params: AppFeedbackChatHelper.buildListQuery(activeFilter.value, currentPage.value, search.value, listOptions.value),
    });
    if (request === latestRequest) {
      feedbacks.value = response.data?.data ?? [];
      total.value = response.data?.meta?.filter_count ?? feedbacks.value.length;
      loadError.value = false;
      // Keep only selections that are still visible and selectable.
      selectedIds.value = selectedIds.value.filter(id => selectableFeedbacks.value.some(feedback => feedback.id === id));
    }
  } catch (error) {
    console.error('[rocket-meals-module] loading app feedbacks failed', error);
    if (request === latestRequest) {
      feedbacks.value = [];
      loadError.value = true;
    }
  } finally {
    if (request === latestRequest) {
      loading.value = false;
    }
  }
}

let latestCountRequest = 0;

async function loadCounts() {
  const request = ++latestCountRequest;
  const entries = await Promise.all(
    AppFeedbackChatStatusHelper.FILTERS.map(async filter => {
      try {
        const response = await api.get(AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, {
          params: AppFeedbackChatHelper.buildCountQuery(filter, listOptions.value, search.value),
        });
        return [filter, Number(response.data?.data?.[0]?.count?.id ?? 0)] as const;
      } catch {
        return [filter, undefined] as const;
      }
    })
  );
  if (request === latestCountRequest) {
    counts.value = Object.fromEntries(entries.filter(([, count]) => count !== undefined));
  }
}

function reload() {
  loadFeedbacks();
  loadCounts();
}

function selectFilter(filter: FoodFeedbackChatFilter) {
  activeFilter.value = filter;
  currentPage.value = 1;
}

function openChat(feedback: AppFeedbackListItem) {
  router.push(RocketMealsModulePages.getRoute(page, feedback.id));
}

function isSelected(feedback: AppFeedbackListItem) {
  return selectedIds.value.includes(feedback.id);
}

function toggleSelected(feedback: AppFeedbackListItem, selected: boolean) {
  const others = selectedIds.value.filter(id => id !== feedback.id);
  selectedIds.value = selected ? [...others, feedback.id] : others;
}

function toggleSelectAll(selected: boolean) {
  selectedIds.value = selected ? selectableFeedbacks.value.map(feedback => feedback.id) : [];
}

function isResolving(feedback: AppFeedbackListItem) {
  return resolvingIds.value.includes(feedback.id);
}

async function markResolved(feedbacksToResolve: readonly AppFeedbackListItem[]) {
  const pending = feedbacksToResolve.filter(feedback => !isResolving(feedback));
  if (pending.length === 0) {
    return;
  }
  const pendingIds = pending.map(feedback => feedback.id);
  resolvingIds.value = [...resolvingIds.value, ...pendingIds];
  try {
    const result = await AppFeedbackChatActions.markResolved(api, pending);
    selectedIds.value = selectedIds.value.filter(id => !result.resolvedIds.includes(id));
    if (result.failedIds.length > 0) {
      notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_mark_resolved_failed), type: 'error' });
    }
  } finally {
    resolvingIds.value = resolvingIds.value.filter(id => !pendingIds.includes(id));
    reload();
  }
}

/**
 * The label of the button that leads to the conversation. A store review is answered on its page
 * as well – the hook publishes the answer in the store, so there is no external link.
 */
function getOpenLabel(feedback: AppFeedbackListItem): string {
  if (AppFeedbackChatStatusHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW) {
    return translate(BackendTranslationKeys.rocket_meals_module_reply);
  }
  return AppFeedbackChatStatusHelper.isStoreReview(feedback) ? translate(BackendTranslationKeys.rocket_meals_module_to_store_response) : translate(BackendTranslationKeys.rocket_meals_module_to_chat);
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (currentPage.value === 1) {
      reload();
    } else {
      currentPage.value = 1;
      loadCounts();
    }
  }, 300);
});
watch([source, typeFilter, sort, pageSize], () => {
  storeSettings({ source: source.value, sort: sort.value, pageSize: pageSize.value });
  if (currentPage.value === 1) {
    reload();
  } else {
    currentPage.value = 1;
    loadCounts();
  }
});
watch([activeFilter, currentPage], loadFeedbacks);
onMounted(reload);
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="reload">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="app-feedbacks">
      <div class="filters">
        <button v-for="filter in AppFeedbackChatStatusHelper.FILTERS" :key="filter" class="filter" :class="{ active: filter === activeFilter }" @click="selectFilter(filter)">
          {{ translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)) }}
          <span v-if="counts[filter] !== undefined" class="count">{{ counts[filter] }}</span>
        </button>
      </div>

      <div class="toolbar">
        <div class="toolbar-item">
          <v-select v-model="source" :items="sourceItems" />
        </div>
        <div class="toolbar-item">
          <v-select v-model="typeFilter" :items="typeItems" />
        </div>
        <div class="toolbar-item">
          <v-select v-model="sort" :items="sortItems" />
        </div>
      </div>

      <div v-if="selectableFeedbacks.length > 0" class="selection-bar">
        <v-checkbox :model-value="allSelected" :indeterminate="someSelected" :label="selectedFeedbacks.length > 0 ? translate(BackendTranslationKeys.rocket_meals_module_selected_count, { count: selectedFeedbacks.length }) : translate(BackendTranslationKeys.rocket_meals_module_select_all_on_page)" @update:model-value="toggleSelectAll" />
        <span class="spacer" />
        <v-button v-if="selectedFeedbacks.length > 0" small :loading="selectedFeedbacks.some(isResolving)" @click="markResolved(selectedFeedbacks)">
          <v-icon name="task_alt" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_mark_selected_resolved) }}
        </v-button>
      </div>

      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div v-else-if="!loading && feedbacks.length === 0" class="empty type-note">
        {{ translate(BackendTranslationKeys.no_data_found) }}
      </div>

      <div v-else class="list" :class="{ loading }">
        <div v-for="feedback in feedbacks" :key="feedback.id" class="feedback" :class="{ selected: isSelected(feedback) }" @click="openChat(feedback)">
          <div class="feedback-select" @click.stop>
            <v-checkbox v-if="AppFeedbackChatHelper.canMarkResolved(feedback)" :model-value="isSelected(feedback)" @update:model-value="toggleSelected(feedback, $event)" />
          </div>
          <div class="source-icon" :class="{ positive: AppFeedbackChatHelper.isPositive(feedback) === true, negative: AppFeedbackChatHelper.isPositive(feedback) === false }">
            <v-icon v-tooltip.bottom="translate(AppFeedbackChatHelper.getSourceLabelKey(feedback))" :name="AppFeedbackChatHelper.getTypeIcon(feedback) ?? AppFeedbackChatHelper.getSourceIcon(feedback)" />
          </div>
          <div class="feedback-content">
            <div class="feedback-header">
              <food-feedback-status-chip :status="AppFeedbackChatStatusHelper.getStatus(feedback)" />
              <span class="title type-label">{{ AppFeedbackChatHelper.getTitle(feedback) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
              <food-feedback-rating :rating="feedback.source_rating_raw" />
              <span class="spacer" />
              <span class="meta type-note">
                <v-icon :name="AppFeedbackChatHelper.getSourceIcon(feedback)" x-small />
                {{ translate(AppFeedbackChatHelper.getSourceLabelKey(feedback)) }}
                <template v-if="AppFeedbackChatHelper.getDeviceDescription(feedback)"> · {{ AppFeedbackChatHelper.getDeviceDescription(feedback) }}</template>
                · {{ formatDateTime(feedback.date_created) }}
              </span>
            </div>
            <q v-if="AppFeedbackChatHelper.getContent(feedback)" class="content">{{ AppFeedbackChatHelper.getContent(feedback) }}</q>
            <div class="feedback-actions">
              <v-button v-if="AppFeedbackChatHelper.canMarkResolved(feedback)" small secondary :loading="isResolving(feedback)" @click.stop="markResolved([feedback])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
              </v-button>
              <v-button small :secondary="AppFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" @click.stop="openChat(feedback)">
                <v-icon name="forum" left small />
                {{ getOpenLabel(feedback) }}
              </v-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > 0" class="pagination">
        <v-pagination v-if="pageCount > 1" v-model="currentPage" :length="pageCount" :total-visible="7" show-first-last />
        <span class="spacer" />
        <div class="page-size">
          <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_items_per_page) }}</span>
          <v-select v-model="pageSize" class="page-size-select" :items="pageSizeItems" inline />
        </div>
      </div>
    </div>
  </private-view>
</template>

<style scoped>
.app-feedbacks {
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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-item {
  flex: 1 1 10rem;
  min-inline-size: 0;
}

.selection-bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-block-size: 2.5rem;
  padding: 0 1.25rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
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

.count {
  min-inline-size: 1.5rem;
  padding: 0 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  background: rgb(0 0 0 / 0.12);
  border-radius: 1rem;
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

.feedback {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: border-color var(--fast) var(--transition);
}

.feedback:hover,
.feedback.selected {
  border-color: var(--theme--primary);
}

.feedback-select {
  flex: none;
  inline-size: 1.5rem;
  padding-block-start: 0.25rem;
  cursor: default;
}

.source-icon {
  --v-icon-color: var(--theme--foreground-subdued);

  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 3rem;
  block-size: 3rem;
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.source-icon.positive {
  --v-icon-color: var(--theme--success);
}

.source-icon.negative {
  --v-icon-color: var(--theme--danger);
}

.feedback-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-inline-size: 0;
}

.feedback-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.title {
  overflow-wrap: anywhere;
}

.meta {
  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
}

.spacer {
  flex: 1;
}

/* `<q>` puts the quotation marks of the page language around the content. */
.content {
  display: -webkit-box;
  overflow: hidden;
  font-style: italic;
  white-space: pre-line;
  overflow-wrap: anywhere;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty {
  padding: 3rem 0;
  text-align: center;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.page-size {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
