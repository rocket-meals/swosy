<script setup lang="ts">
/** Start page of the module: one card per page, so the module explains itself. */
import { useAppExtensionTranslate } from '../helpers/app-extensions/useAppExtensionTranslate';
import { RocketMealsModulePages } from '../helpers/rocket-meals-module/RocketMealsModulePages';
import ModuleNavigation from './module-navigation.vue';

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <private-view :title="RocketMealsModulePages.MODULE_NAME" :icon="RocketMealsModulePages.MODULE_ICON">
    <template #navigation>
      <module-navigation />
    </template>

    <div class="overview">
      <router-link v-for="page in RocketMealsModulePages.PAGES" :key="page.path" :to="RocketMealsModulePages.getRoute(page)" class="page-card">
        <v-icon :name="page.icon" large class="page-icon" />
        <div>
          <div class="type-title">{{ translate(page.labelKey) }}</div>
          <div class="type-note">{{ translate(page.descriptionKey) }}</div>
        </div>
      </router-link>
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

.page-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem;
  color: var(--theme--foreground);
  text-decoration: none;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  transition: border-color var(--fast) var(--transition);
}

.page-card:hover {
  border-color: var(--theme--primary);
}

.page-icon {
  --v-icon-color: var(--theme--primary);
}
</style>
