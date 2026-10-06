<script setup lang="ts">
/** Coloured chip with the chat status of a food feedback. */
import { computed } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { FoodFeedbackChatHelper, type FoodFeedbackChatStatus } from '../../helpers/rocket-meals-module/FoodFeedbackChatHelper';

const props = defineProps<{ status: FoodFeedbackChatStatus }>();

const { translate } = useAppExtensionTranslate();
const presentation = computed(() => FoodFeedbackChatHelper.getStatusPresentation(props.status));
</script>

<template>
  <span class="status-chip" :style="{ '--status-color': presentation.color }">
    <v-icon :name="presentation.icon" x-small />
    {{ translate(presentation.labelKey) }}
  </span>
</template>

<style scoped>
.status-chip {
  --v-icon-color: var(--status-color);

  display: inline-flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.125rem 0.5rem;
  color: var(--status-color);
  font-weight: 600;
  font-size: 0.75rem;
  white-space: nowrap;
  border: var(--theme--border-width) solid var(--status-color);
  border-radius: 1rem;
}
</style>
