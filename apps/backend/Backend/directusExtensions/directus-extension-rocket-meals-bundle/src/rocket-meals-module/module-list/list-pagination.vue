<script setup lang="ts">
/**
 * The pages below a list of the module `Rocket Meals`. With `v-model:page-size` it also offers how
 * many items a page shows; then it stays visible on a single page, so the size can be raised again.
 */
import { ModuleListHelper } from '../../helpers/rocket-meals-module/ModuleListHelper';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

defineProps<{ page: number; pageCount: number; total: number; pageSize?: number }>();
defineEmits<{ 'update:page': [page: number]; 'update:pageSize': [pageSize: number] }>();

const { translate } = useAppExtensionTranslate();
const pageSizeItems = ModuleListHelper.getPageSizeItems();
</script>

<template>
  <div v-if="pageSize !== undefined ? total > 0 : pageCount > 1" class="pagination">
    <v-pagination v-if="pageCount > 1" :model-value="page" :length="pageCount" :total-visible="7" show-first-last @update:model-value="$emit('update:page', $event)" />
    <template v-if="pageSize !== undefined">
      <span class="spacer" />
      <div class="page-size">
        <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_items_per_page) }}</span>
        <v-select :model-value="pageSize" :items="pageSizeItems" inline @update:model-value="$emit('update:pageSize', $event)" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}

.spacer {
  flex: 1;
}

.page-size {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
