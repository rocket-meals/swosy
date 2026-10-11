<script setup lang="ts">
/**
 * Page "App-Feedbacks": the latest feedbacks on the app – from the feedback form in the app and
 * reviews pulled from the App Store and Google Play – filterable by chat status, sources and
 * thumbs up / down (several can be ticked, none ticked means all), sortable by date. Feedbacks
 * can be marked as done right from the list – one by one or several selected at once, without answering (also store reviews and anonymous ones,
 * e.g. positive feedback). Every row leads to the chat with the author
 * (`app-feedback-chat-page.vue`), store reviews to their public answer.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { AppFeedbackChatActions } from '../../helpers/rocket-meals-module/AppFeedbackChatActions';
import { AppFeedbackAnswerChannel, AppFeedbackChatHelper, AppFeedbackTypeFilter, type AppFeedbackListItem, type AppFeedbackListOptions } from '../../helpers/rocket-meals-module/AppFeedbackChatHelper';
import { FoodFeedbackChatHelper, FoodFeedbackListSort } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useModuleStatusList } from '../composables/useModuleStatusList';
import FilterSelect from '../filter-select.vue';
import ModuleNavigation from '../module-navigation.vue';
import ListContent from '../module-list/list-content.vue';
import ListPagination from '../module-list/list-pagination.vue';
import ListRow from '../module-list/list-row.vue';
import ListSearchActions from '../module-list/list-search-actions.vue';
import ListSelectionBar from '../module-list/list-selection-bar.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FoodFeedbackRating from '../food-feedbacks/food-feedback-rating.vue';
import FoodFeedbackStatusChip from '../food-feedbacks/food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.APP_FEEDBACKS;

/** Status chip, sources, thumbs, sort and page size are remembered per browser, so the page opens again as it was left. `source` is the single source stored before several could be ticked. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('app-feedbacks');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<AppFeedbackListOptions & { source?: AppFeedbackSourceFilter; statusFilter?: FoodFeedbackChatFilter }>(settingsStorage, SETTINGS_STORAGE_KEY);

const sources = ref<AppFeedbackSourceFilter[]>(AppFeedbackChatHelper.getSources(storedSettings.sources ?? (storedSettings.source ? [storedSettings.source] : [])));
const types = ref<AppFeedbackTypeFilter[]>(AppFeedbackChatHelper.getTypes(storedSettings.types));
const sort = ref<FoodFeedbackListSort>(ModuleListHelper.pickAllowed(storedSettings.sort, AppFeedbackChatHelper.SORTS, FoodFeedbackListSort.NEWEST));
const pageSize = ref<number>(ModuleListHelper.getPageSize(storedSettings.pageSize));

const listOptions = computed<AppFeedbackListOptions>(() => ({
  sources: sources.value,
  types: types.value,
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
} = useModuleStatusList<AppFeedbackListItem, FoodFeedbackChatFilter, AppFeedbackListOptions>({
  name: 'app feedbacks',
  endpoint: AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT,
  filters: AppFeedbackChatStatusHelper.FILTERS,
  initialFilter: ModuleListHelper.pickAllowed(storedSettings.statusFilter, AppFeedbackChatStatusHelper.FILTERS, FoodFeedbackChatFilter.OPEN),
  options: listOptions,
  buildListQuery: AppFeedbackChatHelper.buildListQuery,
  buildCountQuery: AppFeedbackChatHelper.buildCountQuery,
  canSelect: AppFeedbackChatHelper.canMarkResolved,
});

const statusChips = computed(() => AppFeedbackChatStatusHelper.FILTERS.map(filter => ({ value: filter, label: translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)), count: counts.value[filter] })));
const sourceItems = computed(() => AppFeedbackChatHelper.SELECTABLE_SOURCES.map(option => ({ text: translate(AppFeedbackChatHelper.getSourceFilterLabelKey(option)), value: option, icon: AppFeedbackChatHelper.getSourceFilterIcon(option) })));
const typeItems = computed(() => AppFeedbackChatHelper.SELECTABLE_TYPES.map(option => ({ text: translate(AppFeedbackChatHelper.getTypeFilterLabelKey(option)), value: option, icon: AppFeedbackChatHelper.getTypeFilterIcon(option), iconColor: AppFeedbackChatHelper.getTypeFilterColor(option) })));
const sortItems = computed(() => AppFeedbackChatHelper.SORTS.map(option => ({ text: translate(FoodFeedbackChatHelper.getSortLabelKey(option)), value: option, icon: FoodFeedbackChatHelper.getSortIcon(option) })));

function openChat(feedback: AppFeedbackListItem) {
  router.push(RocketMealsModulePages.getRoute(page, feedback.id));
}

function markResolved(feedbacksToResolve: readonly AppFeedbackListItem[]) {
  return runUpdate(feedbacksToResolve, pending => AppFeedbackChatActions.markResolved(api, pending), BackendTranslationKeys.rocket_meals_module_mark_resolved_failed);
}

function getOpenIcon(feedback: AppFeedbackListItem): string {
  switch (AppFeedbackChatHelper.getAnswerChannel(feedback)) {
    case AppFeedbackAnswerChannel.MAIL:
      return 'mail';
    case AppFeedbackAnswerChannel.NONE:
      return 'visibility';
    default:
      return 'forum';
  }
}

/**
 * The label of the button that leads to the conversation. A store review is answered on its page
 * as well – the hook publishes the answer in the store, so there is no external link.
 */
function getOpenLabel(feedback: AppFeedbackListItem): string {
  const channel = AppFeedbackChatHelper.getAnswerChannel(feedback);
  if (channel === AppFeedbackAnswerChannel.NONE) {
    return translate(BackendTranslationKeys.rocket_meals_module_details);
  }
  if (channel === AppFeedbackAnswerChannel.MAIL) {
    return feedback.response?.trim() ? translate(BackendTranslationKeys.rocket_meals_module_details) : translate(BackendTranslationKeys.rocket_meals_module_reply_by_mail);
  }
  if (AppFeedbackChatStatusHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW) {
    return translate(BackendTranslationKeys.rocket_meals_module_reply);
  }
  return AppFeedbackChatStatusHelper.isStoreReview(feedback) ? translate(BackendTranslationKeys.rocket_meals_module_to_store_response) : translate(BackendTranslationKeys.rocket_meals_module_to_chat);
}

watch([activeFilter, sources, types, sort, pageSize], () =>
  ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { statusFilter: activeFilter.value, sources: sources.value, types: types.value, sort: sort.value, pageSize: pageSize.value })
);
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

    <div class="app-feedbacks">
      <status-filter-chips :model-value="activeFilter" :filters="statusChips" @update:model-value="selectFilter" />

      <div class="toolbar">
        <div class="toolbar-item">
          <filter-select v-model="sources" :items="sourceItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_source_all)" :placeholder-icon="AppFeedbackChatHelper.getSourceFilterIcon(AppFeedbackSourceFilter.ALL)" />
        </div>
        <div class="toolbar-item">
          <filter-select v-model="types" :items="typeItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_feedback_type_all)" :placeholder-icon="AppFeedbackChatHelper.getTypeFilterIcon(AppFeedbackTypeFilter.ALL)" />
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
        <list-row v-for="feedback in feedbacks" :key="feedback.id" :selectable="AppFeedbackChatHelper.canMarkResolved(feedback)" :selected="isSelected(feedback)" @open="openChat(feedback)" @update:selected="toggleSelected(feedback, $event)">
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
              <v-button v-if="AppFeedbackChatHelper.canMarkResolved(feedback)" small secondary :loading="isUpdating(feedback)" @click.stop="markResolved([feedback])">
                <v-icon name="task_alt" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_mark_resolved) }}
              </v-button>
              <v-button small :secondary="AppFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" @click.stop="openChat(feedback)">
                <v-icon :name="getOpenIcon(feedback)" left small />
                {{ getOpenLabel(feedback) }}
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
.app-feedbacks {
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
</style>
