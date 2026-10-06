<script setup lang="ts">
/** Side navigation of the `Rocket Meals` module, built from `RocketMealsModulePages`. */
import { useRoute } from 'vue-router';
import { useAppExtensionTranslate } from '../helpers/app-extensions/useAppExtensionTranslate';
import { RocketMealsModulePages, type RocketMealsModulePage } from '../helpers/rocket-meals-module/RocketMealsModulePages';

const { translate } = useAppExtensionTranslate();
const route = useRoute();

/** A page stays highlighted on its sub pages too (e.g. a single chat below the feedback list). */
function isActive(page: RocketMealsModulePage) {
  return route.path.startsWith(RocketMealsModulePages.getRoute(page));
}
</script>

<template>
  <v-list nav>
    <v-list-item v-for="page in RocketMealsModulePages.PAGES" :key="page.path" :to="RocketMealsModulePages.getRoute(page)" :active="isActive(page)">
      <v-list-item-icon><v-icon :name="page.icon" /></v-list-item-icon>
      <v-list-item-content>
        <v-text-overflow :text="translate(page.labelKey)" />
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>
