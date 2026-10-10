<script setup lang="ts">
/** Coloured chip with the status or the progress of a feature wish. */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import type { FeatureWishPresentation } from '../../helpers/rocket-meals-module/FeatureWishModuleHelper';

defineProps<{ presentation: FeatureWishPresentation }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <span class="wish-chip" :style="{ '--chip-color': presentation.color }">
    <v-icon :name="presentation.icon" x-small />
    {{ translate(presentation.labelKey) }}
  </span>
</template>

<style scoped>
.wish-chip {
  --v-icon-color: var(--chip-color);

  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.125rem 0.5rem;
  color: var(--chip-color);
  font-weight: 600;
  font-size: 0.75rem;
  white-space: nowrap;
  border: var(--theme--border-width) solid var(--chip-color);
  border-radius: 1rem;
}
</style>
