<script setup lang="ts">
/**
 * Page "Speise-Feedbacks": the latest food feedbacks, by default those with a comment. Filterable
 * by content (comment and/or rating), chat status, canteen, food and rating, sortable by date or rating. Feedbacks can be marked as done right
 * from the list – one by one or several selected at once. Every row leads to the chat with the
 * author (`food-feedback-chat-page.vue`).
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { FoodFeedbackChatActions } from '../../helpers/rocket-meals-module/FoodFeedbackChatActions';
import { FoodFeedbackChatHelper, FoodFeedbackContentFilter, FoodFeedbackListSort, FoodFeedbackRatingFilter, type FoodFeedbackCanteenOption, type FoodFeedbackListItem, type FoodFeedbackListOptions } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useDebouncedRef, useModuleStatusList } from '../composables/useModuleStatusList';
import FilterSelect from '../filter-select.vue';
import ModuleNavigation from '../module-navigation.vue';
import ListContent from '../module-list/list-content.vue';
import ListPagination from '../module-list/list-pagination.vue';
import ListRow from '../module-list/list-row.vue';
import ListSearchActions from '../module-list/list-search-actions.vue';
import ListSelectionBar from '../module-list/list-selection-bar.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';
import FoodFeedbackStatusChip from './food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FOOD_FEEDBACKS;

/** Canteens, sort and page size are remembered per browser – the same person usually looks after the same canteens. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('food-feedbacks');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<FoodFeedbackListOptions>(settingsStorage, SETTINGS_STORAGE_KEY);

const contents = ref<FoodFeedbackContentFilter[]>([...FoodFeedbackChatHelper.DEFAULT_CONTENT_FILTERS]);
const foodSearch = ref('');
const foodSearchQuery = useDebouncedRef(foodSearch, '');
const canteenIds = ref<string[]>(Array.isArray(storedSettings.canteenIds) ? storedSettings.canteenIds.map(String) : []);
const ratingFilter = ref<FoodFeedbackRatingFilter>(FoodFeedbackRatingFilter.ALL);
const sort = ref<FoodFeedbackListSort>(ModuleListHelper.pickAllowed(storedSettings.sort, FoodFeedbackChatHelper.SORTS, FoodFeedbackListSort.NEWEST));
const pageSize = ref<number>(ModuleListHelper.getPageSize(storedSettings.pageSize));
const canteens = ref<FoodFeedbackCanteenOption[]>([]);

const listOptions = computed<FoodFeedbackListOptions>(() => ({
  contents: contents.value,
  canteenIds: canteenIds.value,
  foodSearch: foodSearchQuery.value,
  rating: ratingFilter.value,
  sort: sort.value,
  pageSize: pageSize.value,
}));

const {
  activeFilter,
  search,
  currentPage,
  items: feedbacks,
  total,
  counts,
  loading,
  loadError,
  pageCount,
  reload,
  selectFilter,
  selectableItems: selectableFeedbacks,
  selectedItems: selectedFeedbacks,
  allSelected,
  someSelected,
  isSelected,
  toggleSelected,
  toggleSelectAll,
  isUpdating,
  runUpdate,
} = useModuleStatusList<FoodFeedbackListItem, FoodFeedbackChatFilter, FoodFeedbackListOptions>({
  name: 'food feedbacks',
  endpoint: FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT,
  filters: FoodFeedbackChatStatusHelper.FILTERS,
  initialFilter: FoodFeedbackChatFilter.OPEN,
  options: listOptions,
  buildListQuery: FoodFeedbackChatHelper.buildListQuery,
  buildCountQuery: FoodFeedbackChatHelper.buildCountQuery,
  canSelect: FoodFeedbackChatHelper.canMarkResolved,
});

const apiRoot = String(api.defaults?.baseURL ?? '/');

const statusChips = computed(() => FoodFeedbackChatStatusHelper.FILTERS.map(filter => ({ value: filter, label: translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)), count: counts.value[filter] })));
/** Canteens show their picture; one without picture shows the canteen icon. */
const canteenItems = computed(() => canteens.value.map(canteen => ({ text: canteen.alias || canteen.id, value: canteen.id, imageUrl: FoodFeedbackChatHelper.getCanteenImageUrl(canteen, apiRoot), icon: 'storefront' })));
const contentItems = FoodFeedbackChatHelper.CONTENT_FILTERS.map(content => ({ text: translate(FoodFeedbackChatHelper.getContentFilterLabelKey(content)), value: content, icon: FoodFeedbackChatHelper.getContentFilterIcon(content) }));
/** The rating filter only shows up once feedbacks with a rating are listed. */
const ratingFilterAvailable = computed(() => FoodFeedbackChatHelper.isRatingFilterAvailable(contents.value));
const ratingItems = computed(() => FoodFeedbackChatHelper.getRatingFilters(contents.value).map(rating => ({ text: translate(FoodFeedbackChatHelper.getRatingFilterLabelKey(rating)), value: rating, icon: FoodFeedbackChatHelper.getRatingFilterIcon(rating), iconColor: FoodFeedbackChatHelper.getRatingFilterColor(rating) })));
const sortItems = computed(() => FoodFeedbackChatHelper.SORTS.map(option => ({ text: translate(FoodFeedbackChatHelper.getSortLabelKey(option)), value: option, icon: FoodFeedbackChatHelper.getSortIcon(option) })));

async function loadCanteens() {
  try {
    const response = await api.get(FoodFeedbackChatHelper.CANTEENS_ENDPOINT, { params: FoodFeedbackChatHelper.buildCanteensQuery() });
    canteens.value = response.data?.data ?? [];
  } catch (error) {
    console.error('[rocket-meals-module] loading canteens failed', error);
    canteens.value = [];
  }
}

function openChat(feedback: FoodFeedbackListItem) {
  router.push(RocketMealsModulePages.getRoute(page, feedback.id));
}

function markResolved(feedbacksToResolve: readonly FoodFeedbackListItem[]) {
  return runUpdate(feedbacksToResolve, pending => FoodFeedbackChatActions.markResolved(api, pending), BackendTranslationKeys.rocket_meals_module_mark_resolved_failed);
}

// A rating group that is no longer offered falls back to all ratings – synchronously, so the list loads once with the new contents.
watch(
  contents,
  () => {
    if (!ratingItems.value.some(item => item.value === ratingFilter.value)) {
      ratingFilter.value = FoodFeedbackRatingFilter.ALL;
    }
  },
  { flush: 'sync' }
);
watch([canteenIds, sort, pageSize], () => ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { canteenIds: canteenIds.value, sort: sort.value, pageSize: pageSize.value }));
onMounted(loadCanteens);
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
      <list-search-actions v-model="search" :loading="loading" @refresh="reload" />
    </template>

    <div class="food-feedbacks">
      <status-filter-chips :model-value="activeFilter" :filters="statusChips" @update:model-value="selectFilter" />

      <div class="toolbar">
        <div class="toolbar-item toolbar-wide">
          <filter-select v-model="contents" :items="contentItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_content_any)" placeholder-icon="checklist" />
        </div>
        <div class="toolbar-item toolbar-wide">
          <v-input v-model="foodSearch" type="search" :placeholder="translate(BackendTranslationKeys.rocket_meals_module_search_food)">
            <template #prepend><v-icon name="restaurant" small /></template>
          </v-input>
        </div>
        <div class="toolbar-item toolbar-wide">
          <filter-select v-model="canteenIds" :items="canteenItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_all_canteens)" placeholder-icon="storefront" :disabled="canteenItems.length === 0" />
        </div>
        <div v-if="ratingFilterAvailable" class="toolbar-item">
          <filter-select v-model="ratingFilter" :items="ratingItems" />
        </div>
        <div class="toolbar-item">
          <filter-select v-model="sort" :items="sortItems" />
        </div>
      </div>

      <list-selection-bar v-if="selectableFeedbacks.length > 0" :selected-count="selectedFeedbacks.length" :all-selected="allSelected" :some-selected="someSelected" @toggle-all="toggleSelectAll">
        <v-button v-if="selectedFeedbacks.length > 0" small :loading="selectedFeedbacks.some(isUpdating)" @click="markResolved(selectedFeedbacks)">
          <v-icon name="task_alt" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_mark_selected_resolved) }}
        </v-button>
      </list-selection-bar>

      <list-content :loading="loading" :load-error="loadError" :empty="feedbacks.length === 0">
        <list-row v-for="feedback in feedbacks" :key="feedback.id" :selectable="FoodFeedbackChatHelper.canMarkResolved(feedback)" :selected="isSelected(feedback)" @open="openChat(feedback)" @update:selected="toggleSelected(feedback, $event)">
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
            <q v-if="FoodFeedbackChatStatusHelper.hasComment(feedback)" class="comment">{{ feedback.comment }}</q>
            <div class="feedback-actions">
              <v-button v-if="FoodFeedbackChatHelper.canMarkResolved(feedback)" small secondary :loading="isUpdating(feedback)" @click.stop="markResolved([feedback])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
              </v-button>
              <v-button small :secondary="FoodFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" :disabled="!FoodFeedbackChatStatusHelper.canStartChat(feedback)" @click.stop="openChat(feedback)">
                <v-icon name="forum" left small />
                {{ FoodFeedbackChatStatusHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW ? translate(BackendTranslationKeys.rocket_meals_module_reply) : translate(BackendTranslationKeys.rocket_meals_module_to_chat) }}
              </v-button>
            </div>
          </div>
        </list-row>
      </list-content>

      <list-pagination v-model:page="currentPage" v-model:page-size="pageSize" :page-count="pageCount" :total="total" />
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
</style>
