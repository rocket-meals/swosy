<script setup lang="ts">
/**
 * Start page of the module: one card per page, so the module explains itself. Pages with items
 * waiting for support (food feedbacks, app feedbacks, chats) show their open count as a badge.
 */
import { useApi } from '@directus/extensions-sdk';
import { onMounted, ref } from 'vue';
import { useAppExtensionTranslate } from '../helpers/app-extensions/useAppExtensionTranslate';
import { OpenCountHelper } from '../helpers/rocket-meals-module/OpenCountHelper';
import { RocketMealsModulePages } from '../helpers/rocket-meals-module/RocketMealsModulePages';
import { BackendTranslationKeys } from '../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from './module-navigation.vue';
import ModuleCard from './module-card.vue';

const api = useApi();
const { translate } = useAppExtensionTranslate();

/** Open count per page path; a page without count (or whose request failed) shows no badge. */
const openCounts = ref<Record<string, number>>({});

async function loadOpenCounts() {
  const entries = await Promise.all(
    RocketMealsModulePages.PAGES.map(async page => {
      const request = OpenCountHelper.getRequest(page);
      if (!request) {
        return undefined;
      }
      try {
        const response = await api.get(request.endpoint, { params: request.params });
        const count = OpenCountHelper.parseCount(response.data);
        return count === undefined ? undefined : ([page.path, count] as const);
      } catch {
        // No permission on the collection or a network error: the card is shown without badge.
        return undefined;
      }
    })
  );
  openCounts.value = Object.fromEntries(entries.filter(entry => entry !== undefined));
}

onMounted(loadOpenCounts);
</script>

<template>
  <private-view :title="RocketMealsModulePages.MODULE_NAME" :icon="RocketMealsModulePages.MODULE_ICON">
    <template #navigation>
      <module-navigation />
    </template>

    <div class="overview">
      <module-card v-for="page in RocketMealsModulePages.PAGES" :key="page.path" :to="RocketMealsModulePages.getRoute(page)" :icon="page.icon" :title="translate(page.labelKey)" :note="translate(page.descriptionKey)">
        <template v-if="OpenCountHelper.getBadgeText(openCounts[page.path])" #badge>
          <span class="open-count" role="status" :title="translate(BackendTranslationKeys.rocket_meals_module_open_count, { count: openCounts[page.path] })" :aria-label="translate(BackendTranslationKeys.rocket_meals_module_open_count, { count: openCounts[page.path] })">
            {{ OpenCountHelper.getBadgeText(openCounts[page.path]) }}
          </span>
        </template>
      </module-card>
    </div>
  </private-view>
</template>

<style scoped>
.overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.open-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.25rem;
  block-size: 1.25rem;
  padding-inline: 0.375rem;
  color: var(--white, #fff);
  font-weight: 700;
  font-size: 0.75rem;
  line-height: 1;
  background: var(--theme--danger);
  border-radius: 999px;
}
</style>
