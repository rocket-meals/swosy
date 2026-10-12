<script setup lang="ts">
/**
 * Page "Speise-Feedbacks": the latest food feedbacks, by default those with a comment. Filterable
 * by content (comment and/or rating), chat status, canteen, food and rating, sortable by date or rating. Feedbacks can be marked as done right
 * from the list – one by one or several selected at once. Every row leads to the chat with the
 * author (`food-feedback-chat-page.vue`).
 *
 * An open AI recommendation of a feedback (`action_recommendations`, see `action-recommendations-hook`)
 * marks the recommended button with ✨ and shows its reason and draft reply below the comment; the
 * draft can be taken straight into the chat. Answering, marking as done or dismissing archives it.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { FoodFeedbackChatActions } from '../../helpers/rocket-meals-module/FoodFeedbackChatActions';
import { FoodFeedbackChatHelper, FoodFeedbackContentFilter, FoodFeedbackListSort, FoodFeedbackRatingFilter, type FoodFeedbackCanteenOption, type FoodFeedbackListItem, type FoodFeedbackListOptions } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ModuleDeleteActions } from '../../helpers/rocket-meals-module/ModuleDeleteActions';
import { ActionRecommendationModuleHelper, type ModuleActionRecommendation } from '../../helpers/rocket-meals-module/ActionRecommendationModuleHelper';
import { ActionRecommendationAction } from '../../helpers/action-recommendations/ActionRecommendationDefinitions';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
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
import DeleteConfirmDialog from '../module-list/delete-confirm-dialog.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';
import FoodFeedbackStatusChip from './food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FOOD_FEEDBACKS;

/** Status chip, contents, canteens, rating, sort and page size are remembered per browser, so the page opens again as it was left. Searches are not. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('food-feedbacks');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<FoodFeedbackListOptions & { statusFilter?: FoodFeedbackChatFilter }>(settingsStorage, SETTINGS_STORAGE_KEY);

const contents = ref<FoodFeedbackContentFilter[]>(ModuleListHelper.pickAllowedList(storedSettings.contents, FoodFeedbackChatHelper.CONTENT_FILTERS, FoodFeedbackChatHelper.DEFAULT_CONTENT_FILTERS));
const foodSearch = ref('');
const foodSearchQuery = useDebouncedRef(foodSearch, '');
const canteenIds = ref<string[]>(Array.isArray(storedSettings.canteenIds) ? storedSettings.canteenIds.map(String) : []);
const ratingFilter = ref<FoodFeedbackRatingFilter>(ModuleListHelper.pickAllowed(storedSettings.rating, FoodFeedbackChatHelper.getRatingFilters(contents.value), FoodFeedbackRatingFilter.ALL));
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
  initialFilter: ModuleListHelper.pickAllowed(storedSettings.statusFilter, FoodFeedbackChatStatusHelper.FILTERS, FoodFeedbackChatFilter.OPEN),
  options: listOptions,
  buildListQuery: FoodFeedbackChatHelper.buildListQuery,
  buildCountQuery: FoodFeedbackChatHelper.buildCountQuery,
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

/** With `useDraft` the draft reply of the recommendation is already in the input of the chat. */
function openChat(feedback: FoodFeedbackListItem, useDraft = false) {
  const route = RocketMealsModulePages.getRoute(page, feedback.id);
  router.push(useDraft ? { path: route, query: { [ActionRecommendationModuleHelper.USE_DRAFT_QUERY]: '1' } } : route);
}

/** The open AI recommendation per listed feedback id. */
const recommendations = ref<Record<string, ModuleActionRecommendation>>({});

function getRecommendation(feedback: FoodFeedbackListItem): ModuleActionRecommendation | null {
  return recommendations.value[feedback.id] ?? null;
}

function isRecommended(feedback: FoodFeedbackListItem, action: ActionRecommendationAction): boolean {
  return ActionRecommendationModuleHelper.isAction(getRecommendation(feedback), action);
}

async function loadRecommendations() {
  recommendations.value = await ActionRecommendationModuleHelper.loadOpen(
    api,
    CollectionNames.FOODS_FEEDBACKS,
    feedbacks.value.map(feedback => feedback.id)
  );
}

/** Archives the recommendations of the feedbacks; a failure only costs a stale hint, so it is a warning. */
async function archiveRecommendations(feedbacksDone: readonly FoodFeedbackListItem[]) {
  try {
    await ActionRecommendationModuleHelper.archive(api, feedbacksDone.map(getRecommendation));
  } catch (error) {
    console.error('[rocket-meals-module] archiving action recommendations failed', error);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_update_failed), type: 'warning' });
  }
}

const dismissingIds = ref<string[]>([]);

async function dismissRecommendation(feedback: FoodFeedbackListItem) {
  dismissingIds.value = [...dismissingIds.value, feedback.id];
  try {
    await archiveRecommendations([feedback]);
    await loadRecommendations();
  } finally {
    dismissingIds.value = dismissingIds.value.filter(id => id !== feedback.id);
  }
}

/** Marks as done; the recommendations of the feedbacks that were marked are used up. */
function markResolved(feedbacksToResolve: readonly FoodFeedbackListItem[]) {
  return runUpdate(
    feedbacksToResolve,
    async pending => {
      const result = await FoodFeedbackChatActions.markResolved(api, pending);
      await archiveRecommendations(pending.filter(feedback => !result.failedIds.includes(feedback.id)));
      return result;
    },
    BackendTranslationKeys.rocket_meals_module_mark_resolved_failed
  );
}

/** Every item can be selected (to delete it), marking as done only applies to those not done yet. */
const selectedToResolve = computed(() => selectedFeedbacks.value.filter(FoodFeedbackChatHelper.canMarkResolved));

const deleteDialogOpen = ref(false);

/** Deletes the selected items with their chats, after the question in the dialog. */
async function deleteSelected() {
  await runUpdate(selectedFeedbacks.value, pending => ModuleDeleteActions.deleteItems(api, FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, pending), BackendTranslationKeys.rocket_meals_module_delete_failed);
  deleteDialogOpen.value = false;
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
watch([activeFilter, contents, canteenIds, ratingFilter, sort, pageSize], () =>
  ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { statusFilter: activeFilter.value, contents: contents.value, canteenIds: canteenIds.value, rating: ratingFilter.value, sort: sort.value, pageSize: pageSize.value })
);
onMounted(loadCanteens);
watch(feedbacks, loadRecommendations);
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
        <v-button v-if="selectedToResolve.length > 0" small :loading="selectedToResolve.some(isUpdating)" @click="markResolved(selectedToResolve)">
          <v-icon name="task_alt" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_mark_selected_resolved) }}
        </v-button>
        <v-button v-if="selectedFeedbacks.length > 0" small secondary kind="danger" :loading="selectedFeedbacks.some(isUpdating)" @click="deleteDialogOpen = true">
          <v-icon name="delete" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_delete_selected) }}
        </v-button>
      </list-selection-bar>
      <delete-confirm-dialog v-model="deleteDialogOpen" :count="selectedFeedbacks.length" :loading="selectedFeedbacks.some(isUpdating)" @confirm="deleteSelected" />

      <list-content :loading="loading" :load-error="loadError" :empty="feedbacks.length === 0">
        <list-row v-for="feedback in feedbacks" :key="feedback.id" selectable :selected="isSelected(feedback)" @open="openChat(feedback)" @update:selected="toggleSelected(feedback, $event)">
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
            <div v-if="getRecommendation(feedback)" class="recommendation">
              <div class="recommendation-header type-note">
                <v-icon :name="ActionRecommendationModuleHelper.ICON" x-small />
                <span>
                  {{ translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_title) }}<template v-if="ActionRecommendationModuleHelper.getActionLabelKey(getRecommendation(feedback))">: {{ translate(ActionRecommendationModuleHelper.getActionLabelKey(getRecommendation(feedback))!) }}</template>
                </span>
                <span v-if="ActionRecommendationModuleHelper.getRecommendedBy(getRecommendation(feedback))" class="recommendation-by">
                  · {{ translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_recommended_by, { by: ActionRecommendationModuleHelper.getRecommendedBy(getRecommendation(feedback)) ?? '' }) }}
                </span>
              </div>
              <div v-if="getRecommendation(feedback)?.reason" class="recommendation-reason">{{ getRecommendation(feedback)?.reason }}</div>
              <div v-if="ActionRecommendationModuleHelper.getDraftReply(getRecommendation(feedback))" class="recommendation-draft">{{ ActionRecommendationModuleHelper.getDraftReply(getRecommendation(feedback)) }}</div>
              <div class="recommendation-actions">
                <v-button small secondary :loading="dismissingIds.includes(feedback.id)" @click.stop="dismissRecommendation(feedback)">
                  <v-icon name="close" left small />
                  {{ translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_dismiss) }}
                </v-button>
                <v-button v-if="ActionRecommendationModuleHelper.getDraftReply(getRecommendation(feedback))" small :disabled="!FoodFeedbackChatStatusHelper.canStartChat(feedback)" @click.stop="openChat(feedback, true)">
                  <v-icon :name="ActionRecommendationModuleHelper.ICON" left small />
                  {{ translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_start_chat_with_draft) }}
                </v-button>
              </div>
            </div>
            <div class="feedback-actions">
              <v-button v-if="FoodFeedbackChatHelper.canMarkResolved(feedback)" small secondary :loading="isUpdating(feedback)" @click.stop="markResolved([feedback])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
                <v-icon v-if="isRecommended(feedback, ActionRecommendationAction.MARK_RESOLVED)" v-tooltip="translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_recommended)" class="recommended-badge" :name="ActionRecommendationModuleHelper.ICON" right small />
              </v-button>
              <v-button small :secondary="FoodFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" :disabled="!FoodFeedbackChatStatusHelper.canStartChat(feedback)" @click.stop="openChat(feedback)">
                <v-icon name="forum" left small />
                {{ FoodFeedbackChatStatusHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW ? translate(BackendTranslationKeys.rocket_meals_module_reply) : translate(BackendTranslationKeys.rocket_meals_module_to_chat) }}
                <v-icon v-if="isRecommended(feedback, ActionRecommendationAction.REPLY)" v-tooltip="translate(BackendTranslationKeys.rocket_meals_module_action_recommendation_recommended)" class="recommended-badge" :name="ActionRecommendationModuleHelper.ICON" right small />
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

.recommendation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--theme--primary-background);
  border-inline-start: 3px solid var(--theme--primary);
  border-radius: var(--theme--border-radius);
}

.recommendation-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  align-items: center;
  color: var(--theme--primary);
}

.recommendation-by {
  color: var(--theme--foreground-subdued);
}

.recommendation-reason {
  overflow-wrap: anywhere;
}

/* The draft like a chat bubble of support: what would be sent. */
.recommendation-draft {
  padding: 0.5rem 0.75rem;
  white-space: pre-line;
  overflow-wrap: anywhere;
  background: var(--theme--background);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.recommendation-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.recommended-badge {
  --v-icon-color: currentColor;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
