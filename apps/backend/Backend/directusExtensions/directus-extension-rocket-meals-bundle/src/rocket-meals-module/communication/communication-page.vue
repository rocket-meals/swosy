<script setup lang="ts">
/**
 * Page "Kommunikation": the news, filterable by where the app shows them (news list, popup, food
 * offers), sorted by date (newest first by default). Like Directus' collection view, the sidebar
 * switches between active, archived and all news and offers import and export. Every row shows the
 * image, the title, the locations, the canteens and the time range, and opens the editor
 * (`news-editor-page.vue`); "Neue News" writes a new one. Imported news (from a Studentenwerk
 * website) are marked, the import keeps their texts up to date.
 */
import { useApi } from '@directus/extensions-sdk';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { NewsArchiveFilter, NewsListFilter, NewsListSort, NewsModuleHelper, type NewsListItem, type NewsListOptions } from '../../helpers/rocket-meals-module/NewsModuleHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useModuleStatusList } from '../composables/useModuleStatusList';
import FilterSelect from '../filter-select.vue';
import ModuleNavigation from '../module-navigation.vue';
import ListContent from '../module-list/list-content.vue';
import ListPagination from '../module-list/list-pagination.vue';
import ListRow from '../module-list/list-row.vue';
import ListSearchActions from '../module-list/list-search-actions.vue';
import StatusFilterChips from '../module-list/status-filter-chips.vue';
import FeatureWishChip from '../feature-wishes/feature-wish-chip.vue';

const api = useApi();
const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.COMMUNICATION;

const SETTINGS_STORAGE_KEY = ModuleListHelper.getSettingsStorageKey('communication');
const settingsStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
const storedSettings = ModuleListHelper.readSettings<NewsListOptions & { statusFilter?: NewsListFilter }>(settingsStorage, SETTINGS_STORAGE_KEY);

const pageSize = ref<number>(ModuleListHelper.getPageSize(storedSettings.pageSize));
const archive = ref<NewsArchiveFilter>(ModuleListHelper.pickAllowed(storedSettings.archive, NewsModuleHelper.ARCHIVE_FILTERS, NewsArchiveFilter.ACTIVE));
const sort = ref<NewsListSort>(ModuleListHelper.pickAllowed(storedSettings.sort, NewsModuleHelper.SORTS, NewsListSort.NEWEST));
const listOptions = computed<NewsListOptions>(() => ({ pageSize: pageSize.value, archive: archive.value, sort: sort.value }));

/** Width and height in px of the image in the list (requested at twice the size). */
const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 200;
const apiRoot = String(api.defaults?.baseURL ?? '/');

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
const sortItems = computed(() => NewsModuleHelper.SORTS.map(option => ({ text: translate(NewsModuleHelper.getSortLabelKey(option)), value: option, icon: NewsModuleHelper.getSortIcon(option) })));
const archiveItems = computed(() => NewsModuleHelper.ARCHIVE_FILTERS.map(option => ({ text: translate(NewsModuleHelper.getArchiveFilterLabelKey(option)), value: option })));
/** The export takes the news as listed: same chip, archive filter, search and order. */
const exportFilter = computed(() => NewsModuleHelper.buildFilter(activeFilter.value, archive.value));
const exportLayoutQuery = computed(() => ({ sort: NewsModuleHelper.getSort(sort.value) }));

function imageUrl(news: NewsListItem): string | undefined {
  return NewsModuleHelper.getImageUrl(news, apiRoot, IMAGE_WIDTH, IMAGE_HEIGHT);
}

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

watch([activeFilter, pageSize, archive, sort], () => ModuleListHelper.storeSettings(settingsStorage, SETTINGS_STORAGE_KEY, { statusFilter: activeFilter.value, pageSize: pageSize.value, archive: archive.value, sort: sort.value }));
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
      <div class="toolbar">
        <status-filter-chips :model-value="activeFilter" :filters="statusChips" @update:model-value="selectFilter" />
        <div class="sort">
          <filter-select v-model="sort" :items="sortItems" />
        </div>
      </div>

      <list-content :loading="loading" :load-error="loadError" :empty="newsItems.length === 0">
        <list-row v-for="news in newsItems" :key="news.id" @open="openNews(news)">
          <div class="news-row">
            <div class="news-item">
              <div class="news-image" :class="{ empty: !imageUrl(news) }">
                <img v-if="imageUrl(news)" :src="imageUrl(news)" alt="" loading="lazy" />
                <v-icon v-else name="image" />
              </div>
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
            </div>
          </div>
        </list-row>
      </list-content>

      <list-pagination v-model:page="currentPage" v-model:page-size="pageSize" :page-count="pageCount" :total="total" />
    </div>

    <template #sidebar>
      <sidebar-detail id="archive" icon="archive" :title="translate(BackendTranslationKeys.rocket_meals_module_news_archive)" :badge="archive !== NewsArchiveFilter.ACTIVE">
        <div class="archive-options">
          <v-radio v-for="item in archiveItems" :key="item.value" :value="item.value" :label="item.text" :model-value="archive" @update:model-value="archive = $event" />
        </div>
      </sidebar-detail>
      <export-sidebar-detail :collection="CollectionNames.NEWS" :filter="exportFilter" :search="search" :layout-query="exportLayoutQuery" @refresh="reload" />
    </template>
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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
}

.sort {
  inline-size: 14rem;
  max-inline-size: 100%;
}

@media (max-width: 40rem) {
  .sort {
    inline-size: 100%;
  }
}

/*
 * The image stands left of the text on wide rows and above it on narrow ones (like in the app).
 * The size container is the wrapper `.news-row`, not `.news-item` itself: a container query never
 * matches the container element, so `.news-item` would stay a row and squeeze the text into a
 * one-letter column next to the full-width image on phones.
 */
.news-row {
  flex: 1;
  min-inline-size: 0;
  container-type: inline-size;
}

.news-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  min-inline-size: 0;
}

.news-image {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: 10rem;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-normal);
  border-radius: var(--theme--border-radius);
}

.news-image img {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.news-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-inline-size: 0;
}

@container (max-width: 32rem) {
  .news-item {
    flex-direction: column;
  }

  .news-image {
    inline-size: 100%;
  }

  .news-image.empty {
    display: none;
  }

  .spacer {
    display: none;
  }
}

.archive-options {
  display: flex;
  flex-direction: column;
  gap: 0.4375rem;
  padding: 0.75rem 0;
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
