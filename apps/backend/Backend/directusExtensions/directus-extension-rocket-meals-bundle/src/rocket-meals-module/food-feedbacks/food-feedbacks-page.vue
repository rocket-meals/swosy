<script setup lang="ts">
/**
 * Page "Speise-Feedbacks": the latest food feedbacks with a comment, filterable by chat status.
 * Every row leads to the chat with the author (`food-feedback-chat-page.vue`).
 */
import { useApi } from '@directus/extensions-sdk';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatHelper, FoodFeedbackChatStatus, FoodFeedbackListFilter, type FoodFeedbackListItem } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import FoodFeedbackRating from './food-feedback-rating.vue';
import FoodFeedbackStatusChip from './food-feedback-status-chip.vue';

const api = useApi();
const router = useRouter();
const { translate, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.FOOD_FEEDBACKS;

const activeFilter = ref<FoodFeedbackListFilter>(FoodFeedbackListFilter.OPEN);
const search = ref('');
const currentPage = ref(1);
const feedbacks = ref<FoodFeedbackListItem[]>([]);
const total = ref(0);
const counts = ref<Partial<Record<FoodFeedbackListFilter, number>>>({});
const loading = ref(false);
const loadError = ref(false);

let latestRequest = 0;

async function loadFeedbacks() {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const response = await api.get(FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, {
      params: FoodFeedbackChatHelper.buildListQuery(activeFilter.value, currentPage.value, search.value),
    });
    if (request === latestRequest) {
      feedbacks.value = response.data?.data ?? [];
      total.value = response.data?.meta?.filter_count ?? feedbacks.value.length;
      loadError.value = false;
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

async function loadCounts() {
  const entries = await Promise.all(
    FoodFeedbackChatHelper.FILTERS.map(async filter => {
      try {
        const response = await api.get(FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, {
          params: FoodFeedbackChatHelper.buildCountQuery(filter),
        });
        return [filter, Number(response.data?.data?.[0]?.count?.id ?? 0)] as const;
      } catch {
        return [filter, undefined] as const;
      }
    })
  );
  counts.value = Object.fromEntries(entries.filter(([, count]) => count !== undefined));
}

function reload() {
  loadFeedbacks();
  loadCounts();
}

function selectFilter(filter: FoodFeedbackListFilter) {
  activeFilter.value = filter;
  currentPage.value = 1;
}

function openChat(feedback: FoodFeedbackListItem) {
  router.push(RocketMealsModulePages.getRoute(page, feedback.id));
}

let searchTimeout: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadFeedbacks();
  }, 300);
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

    <div class="food-feedbacks">
      <div class="filters">
        <button v-for="filter in FoodFeedbackChatHelper.FILTERS" :key="filter" class="filter" :class="{ active: filter === activeFilter }" @click="selectFilter(filter)">
          {{ translate(FoodFeedbackChatHelper.getFilterLabelKey(filter)) }}
          <span v-if="counts[filter] !== undefined" class="count">{{ counts[filter] }}</span>
        </button>
      </div>

      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div v-else-if="!loading && feedbacks.length === 0" class="empty type-note">
        {{ translate(BackendTranslationKeys.no_data_found) }}
      </div>

      <div v-else class="list" :class="{ loading }">
        <div v-for="feedback in feedbacks" :key="feedback.id" class="feedback" @click="openChat(feedback)">
          <div class="feedback-header">
            <food-feedback-status-chip :status="FoodFeedbackChatHelper.getStatus(feedback)" />
            <span class="food type-label">{{ FoodFeedbackChatHelper.getFoodName(feedback) }}</span>
            <food-feedback-rating :rating="feedback.rating" />
            <span class="spacer" />
            <span class="meta type-note">
              <template v-if="FoodFeedbackChatHelper.getCanteenName(feedback)">{{ FoodFeedbackChatHelper.getCanteenName(feedback) }} · </template>
              {{ formatDateTime(feedback.date_created) }}
            </span>
          </div>
          <div class="comment">{{ feedback.comment }}</div>
          <div class="feedback-actions">
            <v-button small :secondary="FoodFeedbackChatHelper.getStatus(feedback) !== FoodFeedbackChatStatus.NEW" :disabled="!FoodFeedbackChatHelper.canStartChat(feedback)" @click.stop="openChat(feedback)">
              <v-icon name="forum" left small />
              {{ FoodFeedbackChatHelper.getStatus(feedback) === FoodFeedbackChatStatus.NEW ? translate(BackendTranslationKeys.rocket_meals_module_reply) : translate(BackendTranslationKeys.rocket_meals_module_to_chat) }}
            </v-button>
          </div>
        </div>
      </div>

      <div v-if="FoodFeedbackChatHelper.getPageCount(total) > 1" class="pagination">
        <v-pagination v-model="currentPage" :length="FoodFeedbackChatHelper.getPageCount(total)" :total-visible="7" show-first-last />
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
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: border-color var(--fast) var(--transition);
}

.feedback:hover {
  border-color: var(--theme--primary);
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

.comment {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
}

.empty {
  padding: 3rem 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
