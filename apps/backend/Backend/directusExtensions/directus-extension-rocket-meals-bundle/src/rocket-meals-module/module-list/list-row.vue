<script setup lang="ts">
/**
 * One row of a list of the module `Rocket Meals`: a card that opens the item on click, with a
 * checkbox in front when the item can be selected. The content goes into the default slot.
 */
defineProps<{ selectable?: boolean; selected?: boolean }>();
defineEmits<{ open: []; 'update:selected': [selected: boolean] }>();
</script>

<template>
  <div class="row" :class="{ selected }" @click="$emit('open')">
    <div class="row-select" @click.stop>
      <v-checkbox v-if="selectable" :model-value="selected" @update:model-value="$emit('update:selected', $event)" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: border-color var(--fast) var(--transition);
}

.row:hover,
.row.selected {
  border-color: var(--theme--primary);
}

.row-select {
  flex: none;
  inline-size: 1.5rem;
  padding-block-start: 0.25rem;
  cursor: default;
}
</style>
