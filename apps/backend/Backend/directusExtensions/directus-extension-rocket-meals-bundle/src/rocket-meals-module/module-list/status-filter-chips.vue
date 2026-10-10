<script setup lang="ts" generic="T extends string">
/**
 * The status chips above a list of the module `Rocket Meals` (e.g. open, waiting, done, all), each
 * with the number of matching items once it is known.
 */
defineProps<{ modelValue: T; filters: readonly { value: T; label: string; count?: number }[] }>();
defineEmits<{ 'update:modelValue': [value: T] }>();
</script>

<template>
  <div class="filters">
    <button v-for="filter in filters" :key="filter.value" class="filter" :class="{ active: filter.value === modelValue }" @click="$emit('update:modelValue', filter.value)">
      {{ filter.label }}
      <span v-if="filter.count !== undefined" class="count">{{ filter.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0.875rem;
  color: var(--theme--foreground);
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 2rem;
  cursor: pointer;
}

.filter.active {
  color: var(--foreground-inverted, #fff);
  background: var(--theme--primary);
  border-color: var(--theme--primary);
}

.count {
  min-inline-size: 1.5rem;
  padding: 0 0.375rem;
  font-weight: 600;
  font-size: 0.75rem;
  text-align: center;
  background: rgb(0 0 0 / 0.12);
  border-radius: 1rem;
}
</style>
