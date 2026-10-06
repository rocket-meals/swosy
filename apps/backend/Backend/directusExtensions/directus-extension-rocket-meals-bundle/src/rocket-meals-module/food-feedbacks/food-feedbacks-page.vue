<script setup lang="ts">
/**
 * Page "Speise-Feedbacks": the latest food feedbacks with a comment, filterable by chat status,
 * canteen, food and rating, sortable by date or rating. Feedbacks can be marked as done right
 * from the list – one by one or several selected at once. Every row leads to the chat with the
 * author (`food-feedback-chat-page.vue`).
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { FoodFeedbackChatActions } from '../../helpers/rocket-meals-module/FoodFeedbackChatActions';
import { FoodFeedbackChatHelper, FoodFeedbackListSort, FoodFeedbackRatingFilter, type FoodFeedbackListItem, type FoodFeedbackListOptions } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';
import FoodFeedbackStatusChip from './food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FOOD_FEEDBACKS;

/** Canteens, sort and page size are remembered per browser – the same person usually looks after the same canteens. */
const SETTINGS_STORAGE_KEY = 'rocket-meals-module.food-feedbacks.list-settings';
type StoredListSettings = Pick<FoodFeedbackListOptions, 'canteenIds' | 'sort' | 'pageSize'>;

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
const foodSearch = ref('');
const canteenIds = ref<string[]>(Array.isArray(storedSettings.canteenIds) ? storedSettings.canteenIds.map(String) : []);
const ratingFilter = ref<FoodFeedbackRatingFilter>(FoodFeedbackRatingFilter.ALL);
const sort = ref<FoodFeedbackListSort>(storedSettings.sort && FoodFeedbackChatHelper.SORTS.includes(storedSettings.sort) ? storedSettings.sort : FoodFeedbackListSort.NEWEST);
const pageSize = ref<number>(FoodFeedbackChatHelper.getPageSize(storedSettings.pageSize));
const currentPage = ref(1);
const feedbacks = ref<FoodFeedbackListItem[]>([]);
const total = ref(0);
const counts = ref<Partial<Record<FoodFeedbackChatFilter, number>>>({});
const canteens = ref<{ id: string; alias?: string | null }[]>([]);
const loading = ref(false);
const loadError = ref(false);
const selectedIds = ref<string[]>([]);
const resolvingIds = ref<string[]>([]);

const apiRoot = String(api.defaults?.baseURL ?? '/');

const listOptions = computed<FoodFeedbackListOptions>(() => ({
  canteenIds: canteenIds.value,
  foodSearch: foodSearch.value,
  rating: ratingFilter.value,
  sort: sort.value,
  pageSize: pageSize.value,
}));

const pageCount = computed(() => FoodFeedbackChatHelper.getPageCount(total.value, pageSize.value));
const canteenItems = computed(() => canteens.value.map(canteen => ({ text: canteen.alias || canteen.id, value: canteen.id })));
const ratingItems = computed(() => FoodFeedbackChatHelper.RATING_FILTERS.map(rating => ({ text: translate(FoodFeedbackChatHelper.getRatingFilterLabelKey(rating)), value: rating })));
const sortItems = computed(() => FoodFeedbackChatHelper.SORTS.map(option => ({ text: translate(FoodFeedbackChatHelper.getSortLabelKey(option)), value: option })));
const pageSizeItems = FoodFeedbackChatHelper.PAGE_SIZE_OPTIONS.map(size => ({ text: String(size), value: size }));

/** Feedbacks of this page that can be marked as done – only those can be selected. */
const selectableFeedbacks = computed(() => feedbacks.value.filter(FoodFeedbackChatHelper.canMarkResolved));
const selectedFeedbacks = computed(() => selectableFeedbacks.value.filter(feedback => selectedIds.value.includes(feedback.id)));
const allSelected = computed(() => selectableFeedbacks.value.length > 0 && selectedFeedbacks.value.length === selectableFeedbacks.value.length);
const someSelected = computed(() => selectedFeedbacks.value.length > 0 && !allSelected.value);

let latestRequest = 0;

async function loadFeedbacks() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const response = await api.get(FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, {
      params: FoodFeedbackChatHelper.buildListQuery(activeFilter.value, currentPage.value, search.value, listOptions.value),
    });
    if (request === latestRequest) {
      feedbacks.value = response.data?.data ?? [];
      total.value = response.data?.meta?.filter_count ?? feedbacks.value.length;
      loadError.value = false;
      // Keep only selections that are still visible and selectable.
      selectedIds.value = selectedIds.value.filter(id => selectableFeedbacks.value.some(feedback => feedback.id === id));
    }
  } catch (error) {
    console.error('[rocket-meals-module] loading food feedbacks failed', error);
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
    FoodFeedbackChatStatusHelper.FILTERS.map(async filter => {
      try {
        const response = await api.get(FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, {
          params: FoodFeedbackChatHelper.buildCountQuery(filter, listOptions.value, search.value),
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

async function loadCanteens() {
  try {
    const response = await api.get(FoodFeedbackChatHelper.CANTEENS_ENDPOINT, { params: FoodFeedbackChatHelper.buildCanteensQuery() });
    canteens.value = response.data?.data ?? [];
  } catch (error) {
    console.error('[rocket-meals-module] loading canteens failed', error);
    canteens.value = [];
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

function openChat(feedback: FoodFeedbackListItem) {
  router.push(RocketMealsModulePages.getRoute(page, feedback.id));
}

function isSelected(feedback: FoodFeedbackListItem) {
  return selectedIds.value.includes(feedback.id);
}

function toggleSelected(feedback: FoodFeedbackListItem, selected: boolean) {
  const others = selectedIds.value.filter(id => id !== feedback.id);
  selectedIds.value = selected ? [...others, feedback.id] : others;
}

function toggleSelectAll(selected: boolean) {
  selectedIds.value = selected ? selectableFeedbacks.value.map(feedback => feedback.id) : [];
}

function isResolving(feedback: FoodFeedbackListItem) {
  return resolvingIds.value.includes(feedback.id);
}

async function markResolved(feedbacksToResolve: readonly FoodFeedbackListItem[]) {
  const pending = feedbacksToResolve.filter(feedback => !isResolving(feedback));
  if (pending.length === 0) {
    return;
  }
  const pendingIds = pending.map(feedback => feedback.id);
  resolvingIds.value = [...resolvingIds.value, ...pendingIds];
  try {
    const result = await FoodFeedbackChatActions.markResolved(api, pending);
    selectedIds.value = selectedIds.value.filter(id => !result.resolvedIds.includes(id));
    if (result.failedIds.length > 0) {
      notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_mark_resolved_failed), type: 'error' });
    }
  } finally {
    resolvingIds.value = resolvingIds.value.filter(id => !pendingIds.includes(id));
    reload();
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined;
watch([search, foodSearch], () => {
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
watch([canteenIds, ratingFilter, sort, pageSize], () => {
  storeSettings({ canteenIds: canteenIds.value, sort: sort.value, pageSize: pageSize.value });
  if (currentPage.value === 1) {
    reload();
  } else {
    currentPage.value = 1;
    loadCounts();
  }
});
watch([activeFilter, currentPage], loadFeedbacks);
onMounted(() => {
  reload();
  loadCanteens();
});
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

    <div class="food-feedbacks">
      <div class="filters">
        <button v-for="filter in FoodFeedbackChatStatusHelper.FILTERS" :key="filter" class="filter" :class="{ active: filter === activeFilter }" @click="selectFilter(filter)">
          {{ translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)) }}
          <span v-if="counts[filter] !== undefined" class="count">{{ counts[filter] }}</span>
        </button>
      </div>

      <div class="toolbar">
        <div class="toolbar-item toolbar-wide">
          <v-input v-model="foodSearch" type="search" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_search_food)">
            <template #prepend><v-icon name="restaurant" small /></template>
          </v-input>
        </div>
        <div class="toolbar-item toolbar-wide">
          <v-select v-model="canteenIds" :items="canteenItems" multiple show-deselect :placeholder="translate(BackendTranslationKeys.rocket_meals_module_all_canteens)" :disabled="canteenItems.length === 0" />
        </div>
        <div class="toolbar-item">
          <v-select v-model="ratingFilter" :items="ratingItems" />
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
            <v-checkbox v-if="FoodFeedbackChatHelper.canMarkResolved(feedback)" :model-value="isSelected(feedback)" @update:model-value="toggleSelected(feedback, $event)" />
          </div>
          <div class="food-image">
            <img v-if="FoodFeedbackChatHelper.getFoodImageUrl(feedback, apiRoot)" :src="FoodFeedbackChatHelper.getFoodImageUrl(feedback, apiRoot)" :alt="FoodFeedbackChatHelper.getFoodName(feedback) ?? ''" loading="lazy" />
            <v-icon v-else name="restaurant" />
          </div>
          <div class="feedback-content">
            <div class="feedback-header">
              <food-feedback-status-chip :status="FoodFeedbackChatStatusHelper.getStatus(feedback)" />
              <span class="food type-label">{{ FoodFeedbackChatHelper.getFoodName(feedback) }}</span>
              <food-feedback-rating :rating="feedback.rating" />
              <span class="spacer" />
              <span class="meta type-note">
                <template v-if="FoodFeedbackChatHelper.getCanteenName(feedback)">{{ FoodFeedbackChatHelper.getCanteenName(feedback) }} · </template>
                {{ formatDateTime(feedback.date_created) }}
              </span>
            </div>
            <q class="comment">{{ feedback.comment }}</q>
            <div class="feedback-actions">
              <v-button v-if="FoodFeedbackChatHelper.canMarkResolved(feedback)" small secondary :loading="isResolving(feedback)" @click.stop="markResolved([feedback])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
              </v-button>
              <v-button small :secondary="FoodFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" :disabled="!FoodFeedbackChatStatusHelper.canStartChat(feedback)" @click.stop="openChat(feedback)">
                <v-icon name="forum" left small />
                {{ FoodFeedbackChatStatusHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW ? translate(BackendTranslationKeys.rocket_meals_module_reply) : translate(BackendTranslationKeys.rocket_meals_module_to_chat) }}
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
.food-feedbacks {
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

.toolbar-wide {
  flex-basis: 13rem;
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

.food-image {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 4rem;
  block-size: 4rem;
  overflow: hidden;
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.food-image img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
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

.spacer {
  flex: 1;
}

/* `<q>` puts the quotation marks of the page language around the comment. */
.comment {
  font-style: italic;
  white-space: pre-line;
  overflow-wrap: anywhere;
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
