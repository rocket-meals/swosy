<script setup lang="ts">
/**
 * The bar above a list of the module `Rocket Meals` that selects all items of the page and shows
 * the actions for the selected ones (default slot).
 */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{ selectedCount: number; allSelected: boolean; someSelected: boolean }>();
defineEmits<{ 'toggle-all': [selected: boolean] }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <div class="selection-bar">
    <v-checkbox :model-value="allSelected" :indeterminate="someSelected" :label="selectedCount > 0 ? translate(BackendTranslationKeys.rocket_meals_module_selected_count, { count: selectedCount }) : translate(BackendTranslationKeys.rocket_meals_module_select_all_on_page)" @update:model-value="$emit('toggle-all', $event)" />
    <span class="spacer" />
    <slot />
  </div>
</template>

<style scoped>
.selection-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  min-block-size: 2.5rem;
  padding: 0 1.25rem;
}

.spacer {
  flex: 1;
}
</style>
