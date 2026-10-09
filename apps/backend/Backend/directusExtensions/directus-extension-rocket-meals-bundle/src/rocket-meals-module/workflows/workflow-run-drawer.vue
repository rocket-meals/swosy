<script setup lang="ts">
/**
 * One workflow run in a side drawer: when, how long, who started it, and the log, input, output and
 * result hash. A running run is reloaded every few seconds so its log grows while one watches.
 */
import { useApi } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { WorkflowsActions } from '../../helpers/rocket-meals-module/WorkflowsActions';
import { WorkflowsPageHelper, type WorkflowRunRow } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { WORKFLOW_RUN_STATE } from '../../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import WorkflowStatusDot from './workflow-status-dot.vue';

type RunTab = 'log' | 'input' | 'output' | 'result_hash';

const props = defineProps<{
  /** `undefined` closes the drawer. */
  runId: string | undefined;
  canStart: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'rerun', input: string): void;
  /** The run finished while the drawer was open – the list should reload. */
  (event: 'finished'): void;
}>();

const api = useApi();
const { translate, language, formatDateTime } = useAppExtensionTranslate();

const run = ref<WorkflowRunRow | undefined>();
const loading = ref(false);
const loadError = ref(false);
const tab = ref<RunTab>('log');
const now = ref(new Date());
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const TABS: { value: RunTab; labelKey: BackendTranslationKeys }[] = [
  { value: 'log', labelKey: BackendTranslationKeys.rocket_meals_module_workflows_tab_log },
  { value: 'input', labelKey: BackendTranslationKeys.rocket_meals_module_workflows_tab_input },
  { value: 'output', labelKey: BackendTranslationKeys.rocket_meals_module_workflows_tab_output },
  { value: 'result_hash', labelKey: BackendTranslationKeys.rocket_meals_module_workflows_tab_result_hash },
];

const isRunning = computed(() => run.value?.state === WORKFLOW_RUN_STATE.RUNNING);

async function load(showLoading: boolean) {
  clearTimeout(pollTimer);
  const runId = props.runId;
  if (!runId) {
    return;
  }
  loading.value = showLoading;
  try {
    const wasRunning = isRunning.value;
    const loaded = await WorkflowsActions.loadRun(api, runId);
    if (props.runId !== runId) {
      return;
    }
    run.value = loaded;
    loadError.value = false;
    now.value = new Date();
    if (wasRunning && !isRunning.value) {
      emit('finished');
    }
  } catch (error) {
    console.error('[rocket-meals-module] loading workflow run failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
  if (isRunning.value) {
    pollTimer = setTimeout(() => load(false), 3_000);
  }
}

watch(
  () => props.runId,
  runId => {
    run.value = undefined;
    tab.value = 'log';
    if (runId) {
      load(true);
    } else {
      clearTimeout(pollTimer);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => clearTimeout(pollTimer));

const logLines = computed(() =>
  (run.value?.log ?? '')
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const parsed = WorkflowsPageHelper.splitLogLine(line);
      return { ...parsed, time: parsed.date ? new Intl.DateTimeFormat(language.value, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(parsed.date) : '' };
    })
);

const tabText = computed(() => {
  switch (tab.value) {
    case 'input':
      return WorkflowsPageHelper.formatValue(run.value?.input);
    case 'output':
      return WorkflowsPageHelper.formatValue(run.value?.output);
    case 'result_hash':
      return WorkflowsPageHelper.formatValue(run.value?.result_hash);
    default:
      return '';
  }
});

const duration = computed(() => {
  if (!run.value) {
    return '';
  }
  if (isRunning.value && run.value.date_started) {
    return WorkflowsPageHelper.formatDuration((now.value.getTime() - new Date(run.value.date_started).getTime()) / 1000, language.value);
  }
  return WorkflowsPageHelper.formatDuration(run.value.runtime_in_seconds, language.value);
});

const title = computed(() => translate(BackendTranslationKeys.rocket_meals_module_workflows_run_title, { date: formatDateTime(run.value?.date_started ?? run.value?.date_created) }));

const contentLink = computed(() => (props.runId ? `/content/${CollectionNames.WORKFLOWS_RUNS}/${encodeURIComponent(props.runId)}` : ''));
</script>

<template>
  <v-drawer :model-value="!!runId" :title="run ? title : ''" icon="receipt_long" @cancel="emit('close')" @update:model-value="!$event && emit('close')">
    <template #actions>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_workflows_open_item)" rounded icon secondary :to="contentLink">
        <v-icon name="open_in_new" />
      </v-button>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_workflows_rerun)" rounded icon :disabled="!run || !canStart" @click="run && emit('rerun', WorkflowsPageHelper.inputToText(run.input))">
        <v-icon name="replay" />
      </v-button>
    </template>

    <div class="run-drawer">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>
      <v-progress-circular v-else-if="loading && !run" indeterminate />

      <template v-if="run">
        <div class="facts">
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_state) }}</span>
            <span class="state">
              <workflow-status-dot :state="run.state" small />
              {{ translate(WorkflowsPageHelper.getRunStateLabelKey(run.state)) }}
            </span>
          </div>
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_started_at) }}</span>
            <span>{{ formatDateTime(run.date_started) || '–' }}</span>
          </div>
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_finished_at) }}</span>
            <span>{{ formatDateTime(run.date_finished) || '–' }}</span>
          </div>
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_duration) }}</span>
            <span>{{ duration }}</span>
          </div>
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_started_by) }}</span>
            <span>{{ WorkflowsPageHelper.getStartedBy(run) ?? translate(BackendTranslationKeys.rocket_meals_module_workflows_run_automatic) }}</span>
          </div>
          <div>
            <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_id) }}</span>
            <span class="mono">{{ run.id }}</span>
          </div>
        </div>

        <div class="tabs" role="tablist">
          <button v-for="item in TABS" :key="item.value" role="tab" class="tab" :class="{ active: tab === item.value }" :aria-selected="tab === item.value" @click="tab = item.value">
            {{ translate(item.labelKey) }}
          </button>
        </div>

        <pre v-if="tab === 'log'" class="code"><template v-if="logLines.length === 0"><span class="empty">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_empty) }}</span></template><template v-for="(line, index) in logLines" :key="index"><span v-if="line.time" class="time">{{ line.time }}  </span><span :class="{ error: line.error }">{{ line.text }}</span>
</template></pre>
        <pre v-else class="code"><span v-if="!tabText" class="empty">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_empty) }}</span>{{ tabText }}</pre>
      </template>
    </div>
  </v-drawer>
</template>

<style scoped>
.run-drawer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: var(--content-padding);
  padding-block: 0 var(--content-padding-bottom);
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 1rem;
}

.facts > div {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.state {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.mono {
  font-family: var(--theme--fonts--monospace--font-family, monospace);
  font-size: 0.8125rem;
}

.tabs {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.tab {
  margin-block-end: calc(-1 * var(--theme--border-width));
  padding: 0.5rem 0.75rem;
  color: var(--theme--foreground-subdued);
  white-space: nowrap;
  background: none;
  border-block-end: 2px solid transparent;
  cursor: pointer;
}

.tab.active {
  color: var(--theme--foreground-accent);
  border-block-end-color: var(--theme--primary);
}

.code {
  margin: 0;
  padding: 1rem;
  overflow: auto;
  color: var(--theme--foreground);
  font-size: 0.8125rem;
  font-family: var(--theme--fonts--monospace--font-family, monospace);
  line-height: 1.65;
  white-space: pre;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.time,
.empty {
  color: var(--theme--foreground-subdued);
}

.empty {
  font-style: italic;
}

.error {
  color: var(--theme--danger, #e35169);
}
</style>
