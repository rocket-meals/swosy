<script setup lang="ts">
/** The star rating (1–5) of a food feedback; nothing when the user only commented. */
import { computed } from 'vue';

const props = defineProps<{ rating?: number | null }>();

const MAX_STARS = 5;
const stars = computed(() => {
  const rating = props.rating ?? 0;
  return Array.from({ length: MAX_STARS }, (_, index) => index < Math.round(rating));
});
</script>

<template>
  <span v-if="rating" class="rating" :aria-label="`${rating}/${MAX_STARS}`">
    <v-icon v-for="(filled, index) in stars" :key="index" name="star" :filled="filled" x-small :class="{ filled }" />
  </span>
</template>

<style scoped>
.rating {
  display: inline-flex;
  --v-icon-color: var(--theme--foreground-subdued);
}

.rating .filled {
  --v-icon-color: #f5b400;
}
</style>
