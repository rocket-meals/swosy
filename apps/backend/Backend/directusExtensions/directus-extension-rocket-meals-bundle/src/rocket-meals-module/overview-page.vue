<script setup lang="ts">
/** Start page of the module: one card per page, so the module explains itself. */
import { useAppExtensionTranslate } from '../helpers/app-extensions/useAppExtensionTranslate';
import { RocketMealsModulePages } from '../helpers/rocket-meals-module/RocketMealsModulePages';
import ModuleNavigation from './module-navigation.vue';
import ModuleCard from './module-card.vue';

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <private-view :title="RocketMealsModulePages.MODULE_NAME" :icon="RocketMealsModulePages.MODULE_ICON">
    <template #navigation>
      <module-navigation />
    </template>

    <div class="overview">
      <module-card v-for="page in RocketMealsModulePages.PAGES" :key="page.path" :to="RocketMealsModulePages.getRoute(page)" :icon="page.icon" :title="translate(page.labelKey)" :note="translate(page.descriptionKey)" />
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
</style>
