<script setup lang="ts">
/**
 * One workflow: switch it on or off, start it (also with an input), its schedule with the next runs,
 * a short statistic and the list of its runs. A click on a run opens it with its log in a drawer
 * (`workflow-run-drawer.vue`). While a run is going, the page reloads every few seconds.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { WorkflowsActions } from '../../helpers/rocket-meals-module/WorkflowsActions';
import { WorkflowHealth, WorkflowRunsFilter, WorkflowsPageHelper, type WorkflowOverviewItem, type WorkflowRunRow } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { WORKFLOW_RUN_STATE } from '../../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import WorkflowStatusDot from './workflow-status-dot.vue';
import WorkflowStartDialog from './workflow-start-dialog.vue';
import WorkflowRunDrawer from './workflow-run-drawer.vue';
import WorkflowSwitch from './workflow-switch.vue';
import WorkflowPlayButton from './workflow-play-button.vue';

const props = defineProps<{ workflowId: string }>();

const api = useApi();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, language, formatDateTime } = useAppExtensionTranslate();

const page = RocketMealsModulePages.WORKFLOWS;

const item = ref<WorkflowOverviewItem | undefined>();
const runs = ref<WorkflowRunRow[]>([]);
const total = ref(0);
const limit = ref(WorkflowsPageHelper.RUNS_PAGE_SIZE);
const runsFilter = ref<WorkflowRunsFilter>(WorkflowRunsFilter.ALL);
const loading = ref(false);
const loadError = ref(false);
const now = ref(new Date());
const selectedRunId = ref<string | undefined>();
const startDialog = ref<{ open: boolean; initialInput: string }>({ open: false, initialInput: '' });

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;

const RUN_FILTERS: { value: WorkflowRunsFilter; labelKey: BackendTranslationKeys }[] = [
  { value: WorkflowRunsFilter.ALL, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_all },
  { value: WorkflowRunsFilter.FAILED, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_state_failed },
  { value: WorkflowRunsFilter.SUCCESS, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_state_success },
  { value: WorkflowRunsFilter.RUNNING, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_running },
];

const name = computed(() => WorkflowsPageHelper.getName(props.workflowId, translate));
const canStart = computed(() => !!item.value && WorkflowsPageHelper.canStart(item.value));
const upcoming = computed(() => (item.value?.enabled && item.value.registered ? WorkflowsPageHelper.getUpcomingRuns(item.value, now.value) : []));
const stats = computed(() => WorkflowsPageHelper.getRunStats(runs.value));

async function reload() {
  clearTimeout(refreshTimer);
  loading.value = true;
  try {
    const [overview, loadedRuns] = await Promise.all([WorkflowsActions.loadOverview(api), WorkflowsActions.loadRuns(api, WorkflowsPageHelper.buildRunsQuery(props.workflowId, runsFilter.value, limit.value))]);
    item.value = overview.find(entry => entry.id === props.workflowId);
    runs.value = loadedRuns.runs;
    total.value = loadedRuns.total;
    loadError.value = false;
  } catch (error) {
    console.error('[rocket-meals-module] loading workflow failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
    now.value = new Date();
  }
  const running = item.value?.health === WorkflowHealth.RUNNING || runs.value.some(run => run.state === WORKFLOW_RUN_STATE.RUNNING);
  refreshTimer = setTimeout(reload, running ? WorkflowsPageHelper.REFRESH_WHILE_RUNNING_MS : WorkflowsPageHelper.REFRESH_INTERVAL_MS);
}

watch(runsFilter, () => {
  limit.value = WorkflowsPageHelper.RUNS_PAGE_SIZE;
  reload();
});

watch(
  () => props.workflowId,
  () => {
    item.value = undefined;
    runs.value = [];
    selectedRunId.value = undefined;
    reload();
  }
);

function loadMore() {
  limit.value += WorkflowsPageHelper.RUNS_PAGE_SIZE;
  reload();
}

async function toggleEnabled() {
  if (!item.value) {
    return;
  }
  const target = item.value;
  const enabled = !target.enabled;
  target.enabled = enabled;
  try {
    await WorkflowsActions.setEnabled(api, target.id, enabled);
  } catch (error) {
    console.error('[rocket-meals-module] switching workflow failed', error);
    target.enabled = !enabled;
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_toggle_failed), type: 'error' });
  }
}

function openStartDialog(initialInput?: string) {
  startDialog.value = { open: true, initialInput: initialInput ?? item.value?.schedule?.input_template ?? '' };
}

function onPlay() {
  if (item.value?.schedule?.input_template) {
    openStartDialog();
    return;
  }
  start(null);
}

function onRerun(input: string) {
  selectedRunId.value = undefined;
  openStartDialog(input);
}

async function start(input: string | null) {
  try {
    await WorkflowsActions.start(api, props.workflowId, input);
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_started, { name: name.value }) });
  } catch (error) {
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_start_failed, { name: name.value, error: WorkflowsActions.getErrorMessage(error) }), type: 'error' });
  }
  reload();
}

function runDuration(run: WorkflowRunRow): string {
  if (run.state === WORKFLOW_RUN_STATE.RUNNING && run.date_started) {
    return WorkflowsPageHelper.formatDuration((now.value.getTime() - new Date(run.date_started).getTime()) / 1000, language.value);
  }
  return WorkflowsPageHelper.formatDuration(run.runtime_in_seconds, language.value);
}

function relative(date: Date | string | undefined): string {
  return WorkflowsPageHelper.formatRelative(date, now.value, language.value);
}

onMounted(() => {
  reload();
  clockTimer = setInterval(() => {
    now.value = new Date();
  }, 1_000);
});

onBeforeUnmount(() => {
  clearTimeout(refreshTimer);
  clearInterval(clockTimer);
});
</script>

<template>
  <private-view :title="name" :icon="WorkflowsPageHelper.getIcon(workflowId)">
    <template #title-outer:prepend>
      <v-button class="back" rounded icon secondary exact :to="RocketMealsModulePages.getRoute(page)" :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_back)">
        <v-icon name="arrow_back" />
      </v-button>
    </template>

    <template #headline>
      <v-breadcrumb
        :items="[
          { name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() },
          { name: translate(page.labelKey), to: RocketMealsModulePages.getRoute(page) },
        ]"
      />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="reload">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="workflow">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div class="head">
        <div class="title">
          <workflow-status-dot :state="item?.health" class="title-dot" />
          <div class="title-text">
            <div v-if="item" class="health">{{ translate(WorkflowsPageHelper.getHealthLabelKey(item.health)) }}</div>
            <div class="workflow-id type-note">{{ workflowId }}</div>
          </div>
        </div>
        <div v-if="item" class="actions">
          <workflow-switch :enabled="item.enabled" show-label @toggle="toggleEnabled" />
          <v-button secondary :disabled="!canStart" @click="openStartDialog()">
            <v-icon name="data_object" left />
            {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_start_with_input) }}
          </v-button>
          <workflow-play-button :item="item" @play="onPlay" />
        </div>
      </div>

      <div class="columns">
        <div class="side">
          <section class="panel">
            <h2 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule) }}</h2>
            <div class="schedule">
              {{ WorkflowsPageHelper.describeSchedule(item?.schedule?.cron, language, translate) }}
              <code v-if="item?.schedule?.cron" class="cron">{{ item.schedule.cron }}</code>
            </div>
            <p v-if="item && !item.registered" class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_not_registered) }}</p>
            <p v-else-if="item && !item.schedule?.cron" class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_manual_hint) }}</p>
            <p v-else-if="item && !item.enabled" class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_disabled_schedule_hint) }}</p>
            <template v-else-if="upcoming.length > 0">
              <h3 class="sub-title type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_upcoming_runs) }}</h3>
              <ul class="upcoming">
                <li v-for="(date, index) in upcoming" :key="date.toISOString()" :class="{ first: index === 0 }">
                  <span>{{ formatDateTime(date) }}</span>
                  <span class="type-note">{{ relative(date) }}</span>
                </li>
              </ul>
            </template>
          </section>

          <section v-if="stats.count > 0" class="panel">
            <h2 class="panel-title type-label">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_stats_title, { count: stats.count }) }}</h2>
            <div class="stats">
              <div>
                <b>{{ stats.successRate }} %</b>
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_success_rate) }}</span>
              </div>
              <div>
                <b>{{ WorkflowsPageHelper.formatDuration(stats.averageRuntimeSeconds, language) }}</b>
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_average_runtime) }}</span>
              </div>
              <div>
                <b>{{ item?.lastSuccessAt ? relative(item.lastSuccessAt) : translate(BackendTranslationKeys.rocket_meals_module_workflows_never) }}</b>
                <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_last_success) }}</span>
              </div>
            </div>
          </section>
        </div>

        <section class="runs">
          <div class="runs-head">
            <h2 class="type-title">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_runs) }}</h2>
            <div class="filters">
              <button v-for="filter in RUN_FILTERS" :key="filter.value" class="filter" :class="{ active: filter.value === runsFilter }" @click="runsFilter = filter.value">
                {{ translate(filter.labelKey) }}
              </button>
            </div>
          </div>

          <div v-if="runs.length === 0 && !loading" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_no_runs) }}</div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_state) }}</th>
                  <th>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_started_at) }}</th>
                  <th>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_duration) }}</th>
                  <th>{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_run_started_by) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="run in runs" :key="run.id" :class="{ selected: run.id === selectedRunId }" tabindex="0" @click="selectedRunId = run.id" @keydown.enter="selectedRunId = run.id">
                  <td>
                    <span class="pill" :class="`state-${run.state}`">
                      <workflow-status-dot :state="run.state" small />
                      {{ translate(WorkflowsPageHelper.getRunStateLabelKey(run.state)) }}
                    </span>
                  </td>
                  <td>{{ formatDateTime(run.date_started ?? run.date_created) }}</td>
                  <td>{{ runDuration(run) }}</td>
                  <td>
                    <span class="started-by">
                      <v-icon :name="WorkflowsPageHelper.getStartedBy(run) ? 'person' : 'schedule'" x-small />
                      {{ WorkflowsPageHelper.getStartedBy(run) ?? translate(BackendTranslationKeys.rocket_meals_module_workflows_run_automatic) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="runs.length < total" class="more">
            <v-button secondary :loading="loading" @click="loadMore">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_load_more) }} ({{ total - runs.length }})</v-button>
          </div>
        </section>
      </div>
    </div>

    <workflow-run-drawer :run-id="selectedRunId" :can-start="canStart" @close="selectedRunId = undefined" @rerun="onRerun" @finished="reload" />
    <workflow-start-dialog v-model="startDialog.open" :workflow-name="name" :initial-input="startDialog.initialInput" @start="start" />
  </private-view>
</template>

<style scoped>
.workflow {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.back {
  margin-inline-end: 0.5rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.title {
  display: flex;
  flex: 1 1 18rem;
  gap: 0.75rem;
  align-items: center;
  min-inline-size: 0;
}

.title-dot {
  inline-size: 1rem;
  block-size: 1rem;
}

.title-text {
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.health {
  color: var(--theme--foreground-accent);
  font-weight: 600;
}

.workflow-id {
  font-family: var(--theme--fonts--monospace--font-family, monospace);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.columns {
  display: grid;
  grid-template-columns: 19rem minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

.panel-title {
  margin: 0;
}

.panel p {
  margin: 0;
}

.schedule {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  color: var(--theme--foreground-accent);
}

.cron {
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  font-family: var(--theme--fonts--monospace--font-family, monospace);
  background: var(--theme--background);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: 4px;
}

.sub-title {
  margin: 0;
}

.upcoming {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.upcoming li {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  font-variant-numeric: tabular-nums;
}

.upcoming li.first {
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.stats div {
  display: flex;
  flex-direction: column;
}

.stats div:last-child {
  grid-column: 1 / -1;
}

.stats b {
  color: var(--theme--foreground-accent);
  font-weight: 600;
  font-size: 1.125rem;
  font-variant-numeric: tabular-nums;
}

.runs-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.75rem;
}

.runs-head h2 {
  margin: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter {
  padding: 0.25rem 0.75rem;
  color: var(--theme--foreground);
  font-size: 0.875rem;
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

.empty {
  padding: 3rem 1rem;
  text-align: center;
  border: var(--theme--border-width) dashed var(--theme--border-color);
  border-radius: var(--theme--border-radius);
}

.table-wrap {
  overflow-x: auto;
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
}

table {
  inline-size: 100%;
  min-inline-size: 34rem;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  padding: 0.625rem 0.875rem;
  color: var(--theme--foreground-subdued);
  font-weight: 500;
  text-align: start;
  white-space: nowrap;
  background: var(--theme--background-subdued);
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

td {
  padding: 0.625rem 0.875rem;
  white-space: nowrap;
  color: var(--theme--foreground-accent);
  font-variant-numeric: tabular-nums;
  border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

tbody tr:last-child td {
  border-block-end: 0;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover td {
  background: var(--theme--background-subdued);
}

tbody tr.selected td {
  background: var(--theme--primary-background, var(--theme--background-normal));
}

.pill {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  padding: 0.125rem 0.625rem 0.125rem 0.5rem;
  font-weight: 500;
  font-size: 0.8125rem;
  white-space: nowrap;
  background: var(--theme--background-normal);
  border-radius: 1rem;
}

.pill.state-success,
.pill.state-skipped {
  color: var(--theme--success, #2ecda7);
  background: var(--theme--success-background, var(--theme--background-normal));
}

.pill.state-failed {
  color: var(--theme--danger, #e35169);
  background: var(--theme--danger-background, var(--theme--background-normal));
}

.pill.state-running {
  color: var(--theme--primary);
  background: var(--theme--primary-background, var(--theme--background-normal));
}

.started-by {
  display: inline-flex;
  gap: 0.375rem;
  align-items: center;
  color: var(--theme--foreground);
}

.more {
  display: flex;
  justify-content: center;
  margin-block-start: 0.75rem;
}

@media (max-width: 60rem) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
