<script setup lang="ts">
/**
 * Round start button of a workflow. Greyed out with the reason as tooltip when it cannot start
 * (disabled, not set up on this server, already running). Stops its click, so a surrounding card does not open.
 */
import { computed } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { WorkflowHealth, WorkflowsPageHelper, type WorkflowOverviewItem } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';

const props = defineProps<{ item: WorkflowOverviewItem }>();

const emit = defineEmits<{ (event: 'play'): void }>();

const { translate } = useAppExtensionTranslate();

const tooltip = computed(() => translate(WorkflowsPageHelper.getStartBlockedReasonKey(props.item) ?? BackendTranslationKeys.rocket_meals_module_workflows_start));
</script>

<template>
  <button class="workflow-play" :disabled="!WorkflowsPageHelper.canStart(item)" :title="tooltip" :aria-label="tooltip" @click.stop.prevent="emit('play')" @keydown.enter.stop>
    <v-icon :name="item.health === WorkflowHealth.RUNNING ? 'hourglass_top' : 'play_arrow'" filled />
  </button>
</template>

<style scoped>
.workflow-play {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  color: var(--foreground-inverted, #fff);
  background: var(--theme--primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--fast) var(--transition);
}

.workflow-play:hover:not(:disabled) {
  transform: scale(1.06);
}

.workflow-play:disabled {
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-normal);
  cursor: not-allowed;
}
</style>
