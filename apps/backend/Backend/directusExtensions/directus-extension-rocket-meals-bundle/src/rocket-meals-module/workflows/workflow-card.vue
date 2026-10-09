<script setup lang="ts">
/**
 * Tile of one workflow on the page "Workflows" (`module-card` look): icon with traffic light, name,
 * on / off switch, schedule, next run, last success and – right next to them – the start button.
 */
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { WorkflowsPageHelper, type WorkflowOverviewItem } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleCard from '../module-card.vue';
import WorkflowStatusDot from './workflow-status-dot.vue';
import WorkflowSwitch from './workflow-switch.vue';
import WorkflowPlayButton from './workflow-play-button.vue';

const props = defineProps<{
  item: WorkflowOverviewItem;
  /** Ticks every second on the page, so "in 4 Minuten" counts down. */
  now: Date;
}>();

const emit = defineEmits<{
  (event: 'open'): void;
  (event: 'toggle'): void;
  (event: 'play'): void;
}>();

const { translate, language } = useAppExtensionTranslate();

function relative(date: Date | string | undefined): string {
  return WorkflowsPageHelper.formatRelative(date, props.now, language.value);
}

function pointInTime(date: Date | string | undefined): string {
  return WorkflowsPageHelper.formatPointInTime(date, props.now, language.value);
}

function nextRun(): Date | undefined {
  return props.item.registered ? WorkflowsPageHelper.getNextRun(props.item, props.now) : undefined;
}
</script>

<template>
  <module-card :icon="WorkflowsPageHelper.getIcon(item.id)" :title="WorkflowsPageHelper.getName(item.id, translate)" :note="item.id" note-monospace :inactive="WorkflowsPageHelper.isInactive(item)" @click="emit('open')">
    <template #badge>
      <workflow-status-dot :state="item.health" :title="translate(WorkflowsPageHelper.getHealthLabelKey(item.health))" />
    </template>

    <template #actions>
      <workflow-switch :enabled="item.enabled" @toggle="emit('toggle')" />
    </template>

    <ul class="facts">
      <li :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule)">
        <v-icon name="schedule" x-small />
        <span>{{ WorkflowsPageHelper.describeSchedule(item.schedule?.cron, language, translate) }}</span>
      </li>
      <li v-if="!item.registered || item.schedule?.cron" :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_next_run)">
        <v-icon name="update" x-small />
        <span v-if="!item.registered" class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_not_registered) }}</span>
        <span v-else-if="!item.enabled" class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_paused) }}</span>
        <span v-else-if="nextRun()"
          >{{ relative(nextRun()) }} <span class="muted">· {{ pointInTime(nextRun()) }}</span></span
        >
        <span v-else class="muted">–</span>
      </li>
      <li :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_last_success)">
        <v-icon name="history" x-small />
        <span v-if="item.lastSuccessAt">
          <span class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_last_success) }}</span>
          {{ relative(item.lastSuccessAt) }} <span class="muted">· {{ pointInTime(item.lastSuccessAt) }}</span>
        </span>
        <span v-else class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_last_success) }} {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_never) }}</span>
      </li>
    </ul>

    <template #aside>
      <workflow-play-button :item="item" @play="emit('play')" />
    </template>
  </module-card>
</template>

<style scoped>
.facts {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  list-style: none;
}

.facts li {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  min-inline-size: 0;
  color: var(--theme--foreground-accent);
  font-variant-numeric: tabular-nums;
}

.facts li .v-icon {
  --v-icon-color: var(--theme--foreground-subdued);

  flex: none;
  align-self: center;
}

.muted {
  color: var(--theme--foreground-subdued);
}
</style>
