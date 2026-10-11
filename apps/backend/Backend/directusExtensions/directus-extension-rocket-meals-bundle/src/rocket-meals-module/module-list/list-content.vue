<script setup lang="ts">
/**
 * The body of a list of the module `Rocket Meals`: an error notice when loading failed, the `empty`
 * slot (default "no data found") when nothing matches, else the items (default slot), dimmed while
 * a new page loads.
 */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{ loading: boolean; loadError: boolean; empty: boolean }>();

const { translate } = useAppExtensionTranslate();
</script>

<template>
  <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

  <div v-else-if="!loading && empty" class="empty type-note">
    <slot name="empty">{{ translate(BackendTranslationKeys.no_data_found) }}</slot>
  </div>

  <div v-else class="list" :class="{ loading }">
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  padding: 3rem 0;
  text-align: center;
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
</style>
