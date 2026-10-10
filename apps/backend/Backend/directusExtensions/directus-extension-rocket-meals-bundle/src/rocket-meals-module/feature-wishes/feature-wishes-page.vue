<script setup lang="ts">
/**
 * Page "Feature-Wünsche": the wishes of the users, filterable by status (to review, published,
 * duplicates, archived), by progress (several can be ticked, none ticked means all) and sortable by
 * date or likes. Wishes can be decided right from the list, one by one or several selected at once:
 * take over the suggestion of the AI, publish or archive. Every row leads to the details of the
 * wish (`feature-wish-page.vue`) with the notes, the progress and the chat with the author. Likes
 * are rows of the same collection but never show up here.
 *
 * On top sits the tile of the workflow that lets the AI sort the new wishes
 * (`FeatureWishModuleHelper.AI_REVIEW_WORKFLOW_ID`), to start it right here. Without a configured AI
 * it is greyed out with a hint where to configure it. People who may not read workflows do not see it.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FeatureWishStatus, type FeatureWishProgress } from 'repo-depkit-common/src/FeatureWishHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FeatureWishModuleActions, type FeatureWishUpdateResult } from '../../helpers/rocket-meals-module/FeatureWishModuleActions';
import { FeatureWishListFilter, FeatureWishListSort, FeatureWishModuleHelper, type FeatureWishListItem, type FeatureWishListOptions } from '../../helpers/rocket-meals-module/FeatureWishModuleHelper';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { WorkflowsActions } from '../../helpers/rocket-meals-module/WorkflowsActions';
import { WorkflowHealth, WorkflowsPageHelper, type WorkflowOverviewItem } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
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
import FeatureWishChip from './feature-wish-chip.vue';
import WorkflowCard from '../workflows/workflow-card.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FEATURE_WISHES;

/** Sort and page size are remembered per browser. */
const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('feature-wishes');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<FeatureWishListOptions>(settingsStorage, SETTINGS_STORAGE_KEY);

const progresses = ref<FeatureWishProgress[]>([]);
const sort = ref<FeatureWishListSort>(ModuleListHelper.pickAllowed(storedSettings.sort, FeatureWishModuleHelper.SORTS, FeatureWishListSort.NEWEST));
const pageSize = ref<number>(ModuleListHelper.getPageSize(storedSettings.pageSize));

const listOptions = computed<FeatureWishListOptions>(() => ({
  progresses: progresses.value,
  sort: sort.value,
  pageSize: pageSize.value,
}));

const {
  activeFilter,
  search,
  currentPage,
  items: wishes,
  total,
  counts,
  loading,
  loadError,
  pageCount,
  reload,
  selectFilter,
  selectedItems: selectedWishes,
  allSelected,
  someSelected,
  isSelected,
  toggleSelected,
  toggleSelectAll,
  isUpdating,
  runUpdate,
} = useModuleStatusList<FeatureWishListItem, FeatureWishListFilter, FeatureWishListOptions>({
  name: 'feature wishes',
  endpoint: FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT,
  filters: FeatureWishModuleHelper.FILTERS,
  initialFilter: FeatureWishListFilter.IN_REVIEW,
  options: listOptions,
  buildListQuery: FeatureWishModuleHelper.buildListQuery,
  buildCountQuery: FeatureWishModuleHelper.buildCountQuery,
});

const statusChips = computed(() => FeatureWishModuleHelper.FILTERS.map(filter => ({ value: filter, label: translate(FeatureWishModuleHelper.getFilterLabelKey(filter)), count: counts.value[filter] })));
const progressItems = computed(() =>
  FeatureWishModuleHelper.PROGRESSES.map(progress => {
    const presentation = FeatureWishModuleHelper.getProgressPresentation(progress)!;
    return { text: translate(presentation.labelKey), value: progress, icon: presentation.icon, iconColor: presentation.color };
  })
);
const sortItems = computed(() => FeatureWishModuleHelper.SORTS.map(option => ({ text: translate(FeatureWishModuleHelper.getSortLabelKey(option)), value: option, icon: FeatureWishModuleHelper.getSortIcon(option) })));

const selectedWithSuggestion = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canAcceptSuggestion));
const selectedToPublish = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canPublish));
const selectedToArchive = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canArchive));

function openWish(wish: FeatureWishListItem) {
  router.push(RocketMealsModulePages.getRoute(page, wish.id));
}

/** Runs a decision on the wishes that are not being updated already, then reloads the list. */
function decide(wishesToUpdate: readonly FeatureWishListItem[], update: (pending: FeatureWishListItem[]) => Promise<FeatureWishUpdateResult>) {
  return runUpdate(wishesToUpdate, update, BackendTranslationKeys.rocket_meals_module_feature_wish_update_failed);
}

function acceptSuggestions(wishesToUpdate: readonly FeatureWishListItem[]) {
  return decide(wishesToUpdate, pending => FeatureWishModuleActions.acceptSuggestions(api, pending));
}

function setStatus(wishesToUpdate: readonly FeatureWishListItem[], status: FeatureWishStatus) {
  return decide(wishesToUpdate, pending => FeatureWishModuleActions.setStatus(api, pending, status));
}

function getAuthorLabel(wish: FeatureWishListItem): string {
  const nickname = FoodFeedbackChatHelper.getNickname(wish.profile);
  if (nickname) {
    return translate(BackendTranslationKeys.rocket_meals_module_user_with_nickname, { nickname });
  }
  return wish.profile ? translate(BackendTranslationKeys.rocket_meals_module_user) : translate(BackendTranslationKeys.rocket_meals_module_feature_wish_without_account);
}

/** The tile of the AI review workflow; `undefined` when it cannot be read (no permission) or does not exist. */
const aiWorkflow = ref<WorkflowOverviewItem | undefined>();
const now = ref(new Date());
let workflowTimer: ReturnType<typeof setTimeout> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;

async function loadAiWorkflow() {
  clearTimeout(workflowTimer);
  const wasRunning = aiWorkflow.value?.health === WorkflowHealth.RUNNING;
  try {
    const overview = await WorkflowsActions.loadOverview(api);
    aiWorkflow.value = overview.find(item => item.id === FeatureWishModuleHelper.AI_REVIEW_WORKFLOW_ID);
  } catch {
    aiWorkflow.value = undefined;
  }
  const running = aiWorkflow.value?.health === WorkflowHealth.RUNNING;
  if (wasRunning && !running) {
    // The AI is done – its suggestions show up in the list.
    reload();
  }
  if (running) {
    workflowTimer = setTimeout(loadAiWorkflow, WorkflowsPageHelper.REFRESH_WHILE_RUNNING_MS);
  }
}

function openAiWorkflow() {
  if (aiWorkflow.value) {
    router.push(RocketMealsModulePages.getRoute(RocketMealsModulePages.WORKFLOWS, aiWorkflow.value.id));
  }
}

async function toggleAiWorkflow() {
  const item = aiWorkflow.value;
  if (!item) {
    return;
  }
  const enabled = !item.enabled;
  item.enabled = enabled;
  try {
    await WorkflowsActions.setEnabled(api, item.id, enabled);
  } catch (error) {
    console.error('[rocket-meals-module] switching the AI review workflow failed', error);
    item.enabled = !enabled;
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_toggle_failed), type: 'error' });
  }
}

async function startAiWorkflow() {
  const item = aiWorkflow.value;
  if (!item || !WorkflowsPageHelper.canStart(item)) {
    return;
  }
  const name = WorkflowsPageHelper.getName(item.id, translate);
  try {
    await WorkflowsActions.start(api, item.id, item.schedule?.input_template ?? null);
    item.health = WorkflowHealth.RUNNING;
    item.runningSince = new Date().toISOString();
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_started, { name }) });
  } catch (error) {
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_start_failed, { name, error: WorkflowsActions.getErrorMessage(error) }), type: 'error' });
  }
  clearTimeout(workflowTimer);
  workflowTimer = setTimeout(loadAiWorkflow, WorkflowsPageHelper.REFRESH_WHILE_RUNNING_MS);
}

watch([sort, pageSize], () => ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { sort: sort.value, pageSize: pageSize.value }));
onMounted(() => {
  loadAiWorkflow();
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1_000);
});
onBeforeUnmount(() => {
  clearTimeout(workflowTimer);
  clearInterval(clockTimer);
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
      <list-search-actions v-model="search" :loading="loading" @refresh="reload" />
    </template>

    <div class="feature-wishes">
      <workflow-card v-if="aiWorkflow" :item="aiWorkflow" :now="now" @open="openAiWorkflow" @toggle="toggleAiWorkflow" @play="startAiWorkflow" />

      <status-filter-chips :model-value="activeFilter" :filters="statusChips" @update:model-value="selectFilter" />

      <div class="toolbar">
        <div class="toolbar-item">
          <filter-select v-model="progresses" :items="progressItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_progress_all)" placeholder-icon="progress_activity" />
        </div>
        <div class="toolbar-item">
          <filter-select v-model="sort" :items="sortItems" />
        </div>
      </div>

      <list-selection-bar v-if="wishes.length > 0" :selected-count="selectedWishes.length" :all-selected="allSelected" :some-selected="someSelected" @toggle-all="toggleSelectAll">
        <v-button v-if="selectedWithSuggestion.length > 0" small :loading="selectedWithSuggestion.some(isUpdating)" @click="acceptSuggestions(selectedWithSuggestion)">
          <v-icon name="robot_2" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_accept_selected_suggestions) }}
        </v-button>
        <v-button v-if="selectedToArchive.length > 0" small secondary :loading="selectedToArchive.some(isUpdating)" @click="setStatus(selectedToArchive, FeatureWishStatus.ARCHIVED)">
          <v-icon name="archive" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_archive_selected) }}
        </v-button>
        <v-button v-if="selectedToPublish.length > 0" small secondary :loading="selectedToPublish.some(isUpdating)" @click="setStatus(selectedToPublish, FeatureWishStatus.PUBLISHED)">
          <v-icon name="public" left small />
          {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_publish_selected) }}
        </v-button>
      </list-selection-bar>

      <list-content :loading="loading" :load-error="loadError" :empty="wishes.length === 0">
        <list-row v-for="wish in wishes" :key="wish.id" selectable :selected="isSelected(wish)" @open="openWish(wish)" @update:selected="toggleSelected(wish, $event)">
          <div v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_likes, { count: FeatureWishModuleHelper.getLikes(wish) })" class="likes">
            <v-icon name="thumb_up" small />
            <span class="likes-count">{{ FeatureWishModuleHelper.getLikes(wish) }}</span>
          </div>
          <div class="wish-content">
            <div class="wish-header">
              <feature-wish-chip :presentation="FeatureWishModuleHelper.getStatusPresentation(wish.status)" />
              <feature-wish-chip v-if="FeatureWishModuleHelper.getProgressPresentation(wish.progress)" :presentation="FeatureWishModuleHelper.getProgressPresentation(wish.progress)!" />
              <span class="title type-label">{{ FeatureWishModuleHelper.getTitle(wish) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
              <span class="spacer" />
              <span class="meta type-note">{{ getAuthorLabel(wish) }} · {{ formatDateTime(wish.date_created) }}</span>
            </div>
            <q v-if="FeatureWishModuleHelper.getDescription(wish)" class="content">{{ FeatureWishModuleHelper.getDescription(wish) }}</q>
            <div v-if="FeatureWishModuleHelper.getRelatedToTitle(wish)" class="related type-note">
              <v-icon name="merge" x-small />
              {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_duplicate_of, { title: FeatureWishModuleHelper.getRelatedToTitle(wish) }) }}
            </div>
            <div v-if="FeatureWishModuleHelper.getSuggestion(wish) && wish.moderation_note_intern" class="note type-note">
              <v-icon name="robot_2" x-small />
              <span>{{ wish.moderation_note_intern }}</span>
            </div>
            <div class="wish-actions">
              <v-button v-if="FeatureWishModuleHelper.canAcceptSuggestion(wish)" small :loading="isUpdating(wish)" @click.stop="acceptSuggestions([wish])">
                <v-icon :name="FeatureWishModuleHelper.getSuggestion(wish)!.icon" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_accept_suggestion, { suggestion: translate(FeatureWishModuleHelper.getSuggestion(wish)!.labelKey) }) }}
              </v-button>
              <v-button v-if="FeatureWishModuleHelper.canArchive(wish)" small secondary :loading="isUpdating(wish)" @click.stop="setStatus([wish], FeatureWishStatus.ARCHIVED)">
                <v-icon name="archive" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_archive) }}
              </v-button>
              <v-button v-if="FeatureWishModuleHelper.canPublish(wish)" small secondary :loading="isUpdating(wish)" @click.stop="setStatus([wish], FeatureWishStatus.PUBLISHED)">
                <v-icon name="public" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_feature_wish_publish) }}
              </v-button>
              <v-button small secondary @click.stop="openWish(wish)">
                <v-icon name="visibility" left small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_details) }}
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
.feature-wishes {
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

.likes {
  --v-icon-color: var(--theme--primary);

  display: flex;
  flex: none;
  flex-direction: column;
  gap: 0.125rem;
  align-items: center;
  justify-content: center;
  inline-size: 3rem;
  block-size: 3rem;
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.likes-count {
  font-weight: 700;
  font-size: 0.875rem;
  line-height: 1;
}

.wish-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-inline-size: 0;
}

.wish-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.title {
  overflow-wrap: anywhere;
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

.related,
.note {
  display: flex;
  gap: 0.375rem;
  align-items: flex-start;
  overflow-wrap: anywhere;
}

.wish-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}
</style>
