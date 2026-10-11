<script setup lang="ts">
/**
 * The header actions of a list page of the module `Rocket Meals`: a search field and a refresh
 * button. More buttons go into the default slot.
 */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{ modelValue: string; loading?: boolean; placeholder?: string }>();
defineEmits<{ 'update:modelValue': [value: string]; refresh: [] }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <div class="search">
    <v-input :model-value="modelValue" type="search" small :placeholder="placeholder ?? translate(BackendTranslationKeys.search)" @update:model-value="$emit('update:modelValue', $event)">
      <template #prepend><v-icon name="search" small /></template>
    </v-input>
  </div>
  <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="$emit('refresh')">
    <v-icon name="refresh" />
  </v-button>
  <slot />
</template>

<style scoped>
.search {
  inline-size: 16rem;
}

@media (max-width: 40rem) {
  .search {
    inline-size: 10rem;
  }
}
</style>
