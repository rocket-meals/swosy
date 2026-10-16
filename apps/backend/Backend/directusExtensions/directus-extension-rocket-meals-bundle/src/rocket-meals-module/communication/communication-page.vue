<script setup lang="ts">
/**
 * Page "Kommunikation": the news, filterable by where the app shows them (news list, popup, food
 * offers) and archived ones, newest first. Every row shows the locations, the canteens and the time
 * range, and opens the editor (`news-editor-page.vue`); "Neue News" writes a new one. Imported news
 * (from a Studentenwerk website) are marked, the import keeps their texts up to date.
 */
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { NewsListFilter, NewsModuleHelper, type NewsListItem, type NewsListOptions } from '../../helpers/rocket-meals-module/NewsModuleHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useModuleStatusList } from '../composables/useModuleStatusList';
import ModuleNavigation from '../module-navigation.vue';
import ListContent from '../module-list/list-content.vue';
import ListPagination from '../module-list/list-pagination.vue';
import ListRow from '../module-list/list-row.vue';
import ListSearchActions from '../module-list/list-search-actions.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FeatureWishChip from '../feature-wishes/feature-wish-chip.vue';

const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.COMMUNICATION;

const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('communication');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<NewsListOptions & { statusFilter?: NewsListFilter }>(settingsStorage, SETTINGS_STORAGE_KEY);

const pageSize = ref<number>(ModuleListHelper.getPageSize(storedSettings.pageSize));
const listOptions = computed<NewsListOptions>(() => ({ pageSize: pageSize.value }));

const {
  activeFilter,
  search,
  currentPage,
  items: newsItems,
  total,
  counts,
  loading,
  loadError,
  pageCount,
  reload,
  selectFilter,
} = useModuleStatusList<NewsListItem, NewsListFilter, NewsListOptions>({
  name: 'news',
  endpoint: NewsModuleHelper.NEWS_ENDPOINT,
  filters: NewsModuleHelper.FILTERS,
  initialFilter: ModuleListHelper.pickAllowed(storedSettings.statusFilter, NewsModuleHelper.FILTERS, NewsListFilter.ALL),
  options: listOptions,
  buildListQuery: NewsModuleHelper.buildListQuery,
  buildCountQuery: NewsModuleHelper.buildCountQuery,
});

const statusChips = computed(() => NewsModuleHelper.FILTERS.map(filter => ({ value: filter, label: translate(NewsModuleHelper.getFilterLabelKey(filter)), count: counts.value[filter] })));

function openNews(news: NewsListItem) {
  router.push(RocketMealsModulePages.getRoute(page, news.id));
}

function canteensLabel(news: NewsListItem): string {
  const names = NewsModuleHelper.getCanteenNames(news);
  return names.length > 0 ? names.join(', ') : translate(BackendTranslationKeys.rocket_meals_module_news_all_canteens);
}

function periodLabel(news: NewsListItem): string {
  const start = news.date ? formatDateTime(news.date) : '';
  const end = news.date_end ? formatDateTime(news.date_end) : '';
  if (start && end) {
    return translate(BackendTranslationKeys.rocket_meals_module_news_period_range, { start, end });
  }
  if (end) {
    return translate(BackendTranslationKeys.rocket_meals_module_news_period_until, { end });
  }
  return start ? translate(BackendTranslationKeys.rocket_meals_module_news_period_from, { start }) : '';
}

watch([activeFilter, pageSize], () => ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { statusFilter: activeFilter.value, pageSize: pageSize.value }));
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_news_new)" rounded icon :to="RocketMealsModulePages.getRoute(page, RocketMealsModulePages.NEW_ITEM_SEGMENT)" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_news_new)">
        <v-icon name="add" />
      </v-button>
    </template>

    <div class="communication">
      <status-filter-chips :model-value="activeFilter" :filters="statusChips" @update:model-value="selectFilter" />

      <list-content :loading="loading" :load-error="loadError" :empty="newsItems.length === 0">
        <list-row v-for="news in newsItems" :key="news.id" @open="openNews(news)">
          <div class="news-content">
            <div class="news-header">
              <feature-wish-chip :presentation="NewsModuleHelper.getStatusPresentation(news.status)" />
              <span class="title type-label">{{ NewsModuleHelper.getTitle(news) ?? translate(BackendTranslationKeys.rocket_meals_module_no_title) }}</span>
              <span class="spacer" />
              <span class="meta type-note">{{ periodLabel(news) }}</span>
            </div>
            <div class="locations">
              <feature-wish-chip v-for="location in NewsModuleHelper.getLocationPresentations(news)" :key="location.location" :presentation="location" />
              <span v-if="NewsModuleHelper.isImported(news)" class="imported type-note">
                <v-icon name="cloud_download" x-small />
                {{ translate(BackendTranslationKeys.rocket_meals_module_news_imported) }}
              </span>
            </div>
            <div class="canteens type-note">
              <v-icon name="restaurant" x-small />
              {{ canteensLabel(news) }}
            </div>
          </div>
        </list-row>
      </list-content>

      <list-pagination v-model:page="currentPage" v-model:page-size="pageSize" :page-count="pageCount" :total="total" />
    </div>
  </private-view>
</template>

<style scoped>
.communication {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-inline-size: 64rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.news-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-inline-size: 0;
}

.news-header,
.locations {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
}

.title {
  overflow-wrap: anywhere;
}

.spacer {
  flex: 1;
}

.imported,
.canteens {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
}
</style>
