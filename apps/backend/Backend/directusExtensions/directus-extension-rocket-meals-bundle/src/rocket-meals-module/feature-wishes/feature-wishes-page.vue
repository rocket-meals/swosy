<script setup lang="ts">
/**
 * Page "Feature-Wünsche": the wishes of the users, filterable by status (to review, published,
 * duplicates, archived), by progress (several can be ticked, none ticked means all) and sortable by
 * date or likes. Wishes can be decided right from the list, one by one or several selected at once:
 * take over the suggestion of the AI, publish or archive. Every row leads to the details of the
 * wish (`feature-wish-page.vue`) with the notes, the progress and the chat with the author. Likes
 * are rows of the same collection but never show up here.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { FeatureWishStatus, type FeatureWishProgress } from 'repo-depkit-common/src/FeatureWishHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FeatureWishModuleActions, type FeatureWishUpdateResult } from '../../helpers/rocket-meals-module/FeatureWishModuleActions';
import { FeatureWishListFilter, FeatureWishListSort, FeatureWishModuleHelper, type FeatureWishListItem, type FeatureWishListOptions } from '../../helpers/rocket-meals-module/FeatureWishModuleHelper';
import { FoodFeedbackChatHelper } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import FilterSelect from '../filter-select.vue';
import ModuleNavigation from '../module-navigation.vue';
import FeatureWishChip from './feature-wish-chip.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FEATURE_WISHES;

/** Sort and page size are remembered per browser. */
const SETTINGS_STORAGE_KEY = 'rocket-meals-module.feature-wishes.list-settings';
type StoredListSettings = Pick<FeatureWishListOptions, 'sort' | 'pageSize'>;

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

const activeFilter = ref<FeatureWishListFilter>(FeatureWishListFilter.IN_REVIEW);
const search = ref('');
const progresses = ref<FeatureWishProgress[]>([]);
const sort = ref<FeatureWishListSort>(storedSettings.sort && FeatureWishModuleHelper.SORTS.includes(storedSettings.sort) ? storedSettings.sort : FeatureWishListSort.NEWEST);
const pageSize = ref<number>(FoodFeedbackChatHelper.getPageSize(storedSettings.pageSize));
const currentPage = ref(1);
const wishes = ref<FeatureWishListItem[]>([]);
const total = ref(0);
const counts = ref<Partial<Record<FeatureWishListFilter, number>>>({});
const loading = ref(false);
const loadError = ref(false);
const selectedIds = ref<string[]>([]);
const updatingIds = ref<string[]>([]);

const listOptions = computed<FeatureWishListOptions>(() => ({
  progresses: progresses.value,
  sort: sort.value,
  pageSize: pageSize.value,
}));

const pageCount = computed(() => FoodFeedbackChatHelper.getPageCount(total.value, pageSize.value));
const progressItems = computed(() =>
  FeatureWishModuleHelper.PROGRESSES.map(progress => {
    const presentation = FeatureWishModuleHelper.getProgressPresentation(progress)!;
    return { text: translate(presentation.labelKey), value: progress, icon: presentation.icon, iconColor: presentation.color };
  })
);
const sortItems = computed(() => FeatureWishModuleHelper.SORTS.map(option => ({ text: translate(FeatureWishModuleHelper.getSortLabelKey(option)), value: option, icon: FeatureWishModuleHelper.getSortIcon(option) })));
const pageSizeItems = FoodFeedbackChatHelper.PAGE_SIZE_OPTIONS.map(size => ({ text: String(size), value: size }));

const selectedWishes = computed(() => wishes.value.filter(wish => selectedIds.value.includes(wish.id)));
const allSelected = computed(() => wishes.value.length > 0 && selectedWishes.value.length === wishes.value.length);
const someSelected = computed(() => selectedWishes.value.length > 0 && !allSelected.value);
const selectedWithSuggestion = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canAcceptSuggestion));
const selectedToPublish = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canPublish));
const selectedToArchive = computed(() => selectedWishes.value.filter(FeatureWishModuleHelper.canArchive));

let latestRequest = 0;

async function loadWishes() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const response = await api.get(FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, {
      params: FeatureWishModuleHelper.buildListQuery(activeFilter.value, currentPage.value, search.value, listOptions.value),
    });
    if (request === latestRequest) {
      wishes.value = response.data?.data ?? [];
      total.value = response.data?.meta?.filter_count ?? wishes.value.length;
      loadError.value = false;
      // Keep only selections that are still visible.
      selectedIds.value = selectedIds.value.filter(id => wishes.value.some(wish => wish.id === id));
    }
  } catch (error) {
    console.error('[rocket-meals-module] loading feature wishes failed', error);
    if (request === latestRequest) {
      wishes.value = [];
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
    FeatureWishModuleHelper.FILTERS.map(async filter => {
      try {
        const response = await api.get(FeatureWishModuleHelper.FEATURE_WISHES_ENDPOINT, {
          params: FeatureWishModuleHelper.buildCountQuery(filter, listOptions.value, search.value),
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
  loadWishes();
  loadCounts();
}

function selectFilter(filter: FeatureWishListFilter) {
  activeFilter.value = filter;
  currentPage.value = 1;
}

function openWish(wish: FeatureWishListItem) {
  router.push(RocketMealsModulePages.getRoute(page, wish.id));
}

function isSelected(wish: FeatureWishListItem) {
  return selectedIds.value.includes(wish.id);
}

function toggleSelected(wish: FeatureWishListItem, selected: boolean) {
  const others = selectedIds.value.filter(id => id !== wish.id);
  selectedIds.value = selected ? [...others, wish.id] : others;
}

function toggleSelectAll(selected: boolean) {
  selectedIds.value = selected ? wishes.value.map(wish => wish.id) : [];
}

function isUpdating(wish: FeatureWishListItem) {
  return updatingIds.value.includes(wish.id);
}

/** Runs a decision on the wishes that are not being updated already, then reloads the list. */
async function decide(wishesToUpdate: readonly FeatureWishListItem[], update: (pending: FeatureWishListItem[]) => Promise<FeatureWishUpdateResult>) {
  const pending = wishesToUpdate.filter(wish => !isUpdating(wish));
  if (pending.length === 0) {
    return;
  }
  const pendingIds = pending.map(wish => wish.id);
  updatingIds.value = [...updatingIds.value, ...pendingIds];
  try {
    const result = await update(pending);
    selectedIds.value = selectedIds.value.filter(id => !result.updatedIds.includes(id));
    if (result.failedIds.length > 0) {
      notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_feature_wish_update_failed), type: 'error' });
    }
  } finally {
    updatingIds.value = updatingIds.value.filter(id => !pendingIds.includes(id));
    reload();
  }
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
watch([progresses, sort, pageSize], () => {
  storeSettings({ sort: sort.value, pageSize: pageSize.value });
  if (currentPage.value === 1) {
    reload();
  } else {
    currentPage.value = 1;
    loadCounts();
  }
});
watch([activeFilter, currentPage], loadWishes);
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

    <div class="feature-wishes">
      <div class="filters">
        <button v-for="filter in FeatureWishModuleHelper.FILTERS" :key="filter" class="filter" :class="{ active: filter === activeFilter }" @click="selectFilter(filter)">
          {{ translate(FeatureWishModuleHelper.getFilterLabelKey(filter)) }}
          <span v-if="counts[filter] !== undefined" class="count">{{ counts[filter] }}</span>
        </button>
      </div>

      <div class="toolbar">
        <div class="toolbar-item">
          <filter-select v-model="progresses" :items="progressItems" multiple :placeholder="translate(BackendTranslationKeys.rocket_meals_module_feature_wish_progress_all)" placeholder-icon="progress_activity" />
        </div>
        <div class="toolbar-item">
          <filter-select v-model="sort" :items="sortItems" />
        </div>
      </div>

      <div v-if="wishes.length > 0" class="selection-bar">
        <v-checkbox :model-value="allSelected" :indeterminate="someSelected" :label="selectedWishes.length > 0 ? translate(BackendTranslationKeys.rocket_meals_module_selected_count, { count: selectedWishes.length }) : translate(BackendTranslationKeys.rocket_meals_module_select_all_on_page)" @update:model-value="toggleSelectAll" />
        <span class="spacer" />
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
      </div>

      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div v-else-if="!loading && wishes.length === 0" class="empty type-note">
        {{ translate(BackendTranslationKeys.no_data_found) }}
      </div>

      <div v-else class="list" :class="{ loading }">
        <div v-for="wish in wishes" :key="wish.id" class="wish" :class="{ selected: isSelected(wish) }" @click="openWish(wish)">
          <div class="wish-select" @click.stop>
            <v-checkbox :model-value="isSelected(wish)" @update:model-value="toggleSelected(wish, $event)" />
          </div>
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
.feature-wishes {
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
  flex-wrap: wrap;
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

.wish {
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

.wish:hover,
.wish.selected {
  border-color: var(--theme--primary);
}

.wish-select {
  flex: none;
  inline-size: 1.5rem;
  padding-block-start: 0.25rem;
  cursor: default;
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
