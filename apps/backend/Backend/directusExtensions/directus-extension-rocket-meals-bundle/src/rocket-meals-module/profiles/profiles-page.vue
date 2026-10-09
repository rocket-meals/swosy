<script setup lang="ts">
/**
 * Page "Profile": search profiles by nickname (or paste an id) and open one. Without search the most
 * recently active profiles are listed. The search is kept in the URL (`?search=`), so the back
 * button of a profile returns to the same results.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { LivePulseHelper } from '../../helpers/rocket-meals-module/LivePulseHelper';
import { ProfileDetailsHelper, type ModuleProfile } from '../../helpers/rocket-meals-module/ProfileDetailsHelper';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import ProfileAvatar from './profile-avatar.vue';

const api = useApi();
const route = useRoute();
const router = useRouter();
const { translate, language } = useAppExtensionTranslate();

const page = RocketMealsModulePages.PROFILES;
const SEARCH_PARAM = 'search';

const search = ref(typeof route.query[SEARCH_PARAM] === 'string' ? route.query[SEARCH_PARAM] : '');
const profiles = ref<ModuleProfile[]>([]);
const total = ref(0);
const currentPage = ref(1);
const loading = ref(false);
const loadError = ref(false);
const pageCount = computed(() => ProfileDetailsHelper.getPageCount(total.value));
const now = ref(new Date());

/** Answers of an older search that arrive late must not replace the newer results. */
let requestCounter = 0;

async function load() {
  const request = ++requestCounter;
  loading.value = true;
  try {
    const response = await api.get(ProfileDetailsHelper.PROFILES_ENDPOINT, { params: ProfileDetailsHelper.buildSearchQuery(search.value, currentPage.value) });
    if (request !== requestCounter) {
      return;
    }
    profiles.value = response.data?.data ?? [];
    total.value = Number(response.data?.meta?.filter_count ?? profiles.value.length);
    now.value = new Date();
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading profiles failed', error);
    if (request === requestCounter) {
      loadError.value = true;
    }
  } finally {
    if (request === requestCounter) {
      loading.value = false;
    }
  }
}

function relative(date: string | null | undefined): string {
  return LivePulseHelper.formatRelativeTime(date, now.value, language.value);
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.replace({ query: { ...route.query, [SEARCH_PARAM]: search.value.trim() || undefined } });
    if (currentPage.value === 1) {
      load();
    } else {
      currentPage.value = 1;
    }
  }, 300);
});
watch(currentPage, load);
onMounted(load);
onBeforeUnmount(() => clearTimeout(searchTimer));
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
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="load">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="profiles">
      <v-input v-model="search" type="search" autofocus :placeholder="translate(BackendTranslationKeys.rocket_meals_module_profiles_search_placeholder)">
        <template #prepend><v-icon name="search" /></template>
      </v-input>

      <div class="type-note">
        {{ search.trim() ? translate(BackendTranslationKeys.rocket_meals_module_profiles_found, { count: total }) : translate(BackendTranslationKeys.rocket_meals_module_profiles_recently_active) }}
      </div>

      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div v-else-if="!loading && profiles.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.no_data_found) }}</div>

      <div v-else class="list" :class="{ loading }">
        <router-link v-for="profile in profiles" :key="profile.id" class="profile" :to="ProfileDetailsHelper.getRoute(profile) ?? ''">
          <profile-avatar :profile="profile" :size="ProfileDetailsHelper.LIST_AVATAR_SIZE" :link="false" />
          <div class="profile-text">
            <span class="name">{{ ProfileDetailsHelper.getNickname(profile) ?? translate(BackendTranslationKeys.rocket_meals_module_live_pulse_no_nickname) }}</span>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_profile_last_active, { time: relative(profile.date_updated) }) }}</span>
          </div>
          <v-icon name="chevron_right" class="chevron" />
        </router-link>
      </div>

      <div v-if="pageCount > 1" class="pagination">
        <v-pagination v-model="currentPage" :length="pageCount" :total-visible="7" show-first-last />
      </div>
    </div>
  </private-view>
</template>

<style scoped>
.profiles {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-inline-size: 48rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.5rem;
  transition: opacity var(--fast) var(--transition);
}

.list.loading {
  opacity: 0.6;
}

.profile {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-inline-size: 0;
  padding: 0.625rem 0.75rem;
  color: inherit;
  text-decoration: none;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  transition: border-color var(--fast) var(--transition);
}

.profile:hover,
.profile:focus-visible {
  border-color: var(--theme--primary);
}

.profile-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
}

.name {
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chevron {
  --v-icon-color: var(--theme--foreground-subdued);
}

.empty {
  padding: 2rem 0;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
