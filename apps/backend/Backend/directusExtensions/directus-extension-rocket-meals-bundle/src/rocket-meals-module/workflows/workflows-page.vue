<script setup lang="ts">
/**
 * Page "Workflows": one tile per workflow with a traffic light (did the latest run that did something
 * go through), a switch to enable / disable it, a button to start it by hand, its schedule with the
 * next run and the last successful run. A click on a tile opens its runs (`workflow-detail-page.vue`).
 *
 * The order of the tiles is computed once when the page opens: failed ones first, then the other
 * enabled ones, disabled ones last. Switching or starting does not move a tile, so the next click
 * still hits the tile one aimed at. Data rules live in `WorkflowsPageHelper`.
 */
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';
import { RocketMealsModulePages } from '../../helpers/rocket-meals-module/RocketMealsModulePages';
import { WorkflowsActions } from '../../helpers/rocket-meals-module/WorkflowsActions';
import { WorkflowHealth, WorkflowsFilter, WorkflowsPageHelper, WorkflowsSort, type WorkflowOverviewItem } from '../../helpers/rocket-meals-module/WorkflowsPageHelper';
import { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import ModuleNavigation from '../module-navigation.vue';
import WorkflowStatusDot from './workflow-status-dot.vue';
import WorkflowStartDialog from './workflow-start-dialog.vue';

const api = useApi();
const router = useRouter();
const { useNotificationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const { translate, language } = useAppExtensionTranslate();

const page = RocketMealsModulePages.WORKFLOWS;

const items = ref<WorkflowOverviewItem[]>([]);
/** Workflow ids in display order – set when the page opens and when the sort is changed by hand. */
const order = ref<string[]>([]);
const loading = ref(false);
const loadError = ref(false);
const activeFilter = ref<WorkflowsFilter>(WorkflowsFilter.ALL);
const search = ref('');
const sort = ref<WorkflowsSort>(WorkflowsSort.AUTOMATIC);
const now = ref(new Date());
const startDialog = ref<{ open: boolean; workflowId: string; initialInput: string }>({ open: false, workflowId: '', initialInput: '' });

let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let clockTimer: ReturnType<typeof setInterval> | undefined;

const FILTERS: { value: WorkflowsFilter; labelKey: BackendTranslationKeys }[] = [
  { value: WorkflowsFilter.ALL, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_all },
  { value: WorkflowsFilter.PROBLEMS, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_problems },
  { value: WorkflowsFilter.RUNNING, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_running },
  { value: WorkflowsFilter.DISABLED, labelKey: BackendTranslationKeys.rocket_meals_module_workflows_filter_disabled },
];

const sortItems = computed(() => [
  { text: translate(BackendTranslationKeys.rocket_meals_module_workflows_sort_automatic), value: WorkflowsSort.AUTOMATIC },
  { text: translate(BackendTranslationKeys.rocket_meals_module_workflows_sort_next_run), value: WorkflowsSort.NEXT_RUN },
  { text: translate(BackendTranslationKeys.rocket_meals_module_workflows_sort_name), value: WorkflowsSort.NAME },
]);

function nameOf(workflowId: string): string {
  return WorkflowsPageHelper.getName(workflowId, translate);
}

function computeOrder() {
  order.value = WorkflowsPageHelper.sort(items.value, sort.value, nameOf, new Date());
}

async function reload() {
  clearTimeout(refreshTimer);
  loading.value = true;
  try {
    items.value = await WorkflowsActions.loadOverview(api);
    loadError.value = false;
    if (order.value.length === 0) {
      computeOrder();
    }
  } catch (error) {
    console.error('[rocket-meals-module] loading workflows failed', error);
    loadError.value = true;
  } finally {
    loading.value = false;
    now.value = new Date();
  }
  const anyRunning = items.value.some(item => item.health === WorkflowHealth.RUNNING);
  refreshTimer = setTimeout(reload, anyRunning ? WorkflowsPageHelper.REFRESH_WHILE_RUNNING_MS : WorkflowsPageHelper.REFRESH_INTERVAL_MS);
}

watch(sort, computeOrder);

const counts = computed<Record<WorkflowsFilter, number>>(() => ({
  [WorkflowsFilter.ALL]: items.value.length,
  [WorkflowsFilter.PROBLEMS]: items.value.filter(item => WorkflowsPageHelper.matchesFilter(item, WorkflowsFilter.PROBLEMS)).length,
  [WorkflowsFilter.RUNNING]: items.value.filter(item => WorkflowsPageHelper.matchesFilter(item, WorkflowsFilter.RUNNING)).length,
  [WorkflowsFilter.DISABLED]: items.value.filter(item => WorkflowsPageHelper.matchesFilter(item, WorkflowsFilter.DISABLED)).length,
}));

const successCount = computed(() => items.value.filter(item => !WorkflowsPageHelper.isInactive(item) && item.health === WorkflowHealth.SUCCESS).length);

const visibleItems = computed(() => WorkflowsPageHelper.applyOrder(items.value, order.value).filter(item => WorkflowsPageHelper.matchesFilter(item, activeFilter.value) && WorkflowsPageHelper.matchesSearch(item, nameOf(item.id), search.value)));

const upNext = computed(() => {
  let next: { item: WorkflowOverviewItem; date: Date } | undefined;
  for (const item of items.value) {
    const date = item.registered ? WorkflowsPageHelper.getNextRun(item, now.value) : undefined;
    if (date && (!next || date < next.date)) {
      next = { item, date };
    }
  }
  return next;
});

function healthLabel(item: WorkflowOverviewItem): string {
  return translate(WorkflowsPageHelper.getHealthLabelKey(item.health));
}

function scheduleLabel(item: WorkflowOverviewItem): string {
  return WorkflowsPageHelper.describeSchedule(item.schedule?.cron, language.value, translate);
}

function nextRunOf(item: WorkflowOverviewItem): Date | undefined {
  return item.registered ? WorkflowsPageHelper.getNextRun(item, now.value) : undefined;
}

function relative(date: Date | string | undefined): string {
  return WorkflowsPageHelper.formatRelative(date, now.value, language.value);
}

function pointInTime(date: Date | string | undefined): string {
  return WorkflowsPageHelper.formatPointInTime(date, now.value, language.value);
}

function startTooltip(item: WorkflowOverviewItem): string {
  const reason = WorkflowsPageHelper.getStartBlockedReasonKey(item);
  return translate(reason ?? BackendTranslationKeys.rocket_meals_module_workflows_start);
}

function openDetail(item: WorkflowOverviewItem) {
  router.push(RocketMealsModulePages.getRoute(page, item.id));
}

async function toggleEnabled(item: WorkflowOverviewItem) {
  const enabled = !item.enabled;
  item.enabled = enabled;
  try {
    await WorkflowsActions.setEnabled(api, item.id, enabled);
  } catch (error) {
    console.error('[rocket-meals-module] switching workflow failed', error);
    item.enabled = !enabled;
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_toggle_failed), type: 'error' });
  }
}

function onPlay(item: WorkflowOverviewItem) {
  const template = item.schedule?.input_template;
  if (template) {
    startDialog.value = { open: true, workflowId: item.id, initialInput: template };
    return;
  }
  start(item.id, null);
}

async function start(workflowId: string, input: string | null) {
  const item = items.value.find(entry => entry.id === workflowId);
  const name = nameOf(workflowId);
  try {
    await WorkflowsActions.start(api, workflowId, input);
    if (item) {
      item.health = WorkflowHealth.RUNNING;
      item.runningSince = new Date().toISOString();
    }
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_started, { name }) });
  } catch (error) {
    notificationsStore.add({ title: translate(BackendTranslationKeys.rocket_meals_module_workflows_start_failed, { name, error: WorkflowsActions.getErrorMessage(error) }), type: 'error' });
  }
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(reload, WorkflowsPageHelper.REFRESH_WHILE_RUNNING_MS);
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
  <private-view :title="translate(page.labelKey)" :icon="page.icon">
    <template #headline>
      <v-breadcrumb :items="[{ name: RocketMealsModulePages.MODULE_NAME, to: RocketMealsModulePages.getRoute() }]" />
    </template>

    <template #navigation>
      <module-navigation />
    </template>

    <template #actions>
      <div class="search">
        <v-input v-model="search" type="search" small :placeholder="translate(BackendTranslationKeys.rocket_meals_module_workflows_search)">
          <template #prepend><v-icon name="search" small /></template>
        </v-input>
      </div>
      <v-button v-tooltip.bottom="translate(BackendTranslationKeys.rocket_meals_module_refresh)" rounded icon secondary :loading="loading" @click="reload">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="workflows">
      <v-notice v-if="loadError" type="danger">{{ translate(BackendTranslationKeys.rocket_meals_module_load_failed) }}</v-notice>

      <div class="summary">
        <span class="stat"
          ><workflow-status-dot :state="WorkflowHealth.SUCCESS" small /><b>{{ successCount }}</b> {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_summary_success) }}</span
        >
        <span class="stat"
          ><workflow-status-dot :state="WorkflowHealth.FAILED" small /><b>{{ counts[WorkflowsFilter.PROBLEMS] }}</b> {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_summary_failed) }}</span
        >
        <span class="stat"
          ><workflow-status-dot :state="WorkflowHealth.RUNNING" small /><b>{{ counts[WorkflowsFilter.RUNNING] }}</b> {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_summary_running) }}</span
        >
        <span v-if="upNext" class="up-next type-note">
          {{ translate(BackendTranslationKeys.rocket_meals_module_workflows_up_next) }}:
          <b>{{ nameOf(upNext.item.id) }}</b>
          {{ relative(upNext.date) }}
        </span>
      </div>

      <div class="toolbar">
        <div class="filters">
          <button v-for="filter in FILTERS" :key="filter.value" class="filter" :class="{ active: filter.value === activeFilter }" @click="activeFilter = filter.value">
            {{ translate(filter.labelKey) }}
            <span class="count">{{ counts[filter.value] }}</span>
          </button>
        </div>
        <div class="sort">
          <span class="type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_sort) }}</span>
          <v-select v-model="sort" :items="sortItems" inline />
        </div>
      </div>

      <v-progress-circular v-if="loading && items.length === 0" indeterminate />
      <div v-else-if="visibleItems.length === 0" class="empty type-note">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_no_match) }}</div>

      <div v-else class="grid">
        <div v-for="item in visibleItems" :key="item.id" class="tile" :class="{ inactive: WorkflowsPageHelper.isInactive(item) }" role="link" tabindex="0" @click="openDetail(item)" @keydown.enter.self="openDetail(item)">
          <div class="tile-icon dim">
            <v-icon :name="WorkflowsPageHelper.getIcon(item.id)" large />
            <workflow-status-dot :state="item.health" :title="healthLabel(item)" class="tile-dot" />
          </div>
          <div class="tile-body">
            <div class="tile-head">
              <div class="tile-name dim">
                <div class="type-title name">{{ nameOf(item.id) }}</div>
                <div class="workflow-id type-note">{{ item.id }}</div>
              </div>
              <button class="switch" role="switch" :aria-checked="item.enabled" :aria-label="translate(item.enabled ? BackendTranslationKeys.rocket_meals_module_workflows_disable : BackendTranslationKeys.rocket_meals_module_workflows_enable)" :title="translate(item.enabled ? BackendTranslationKeys.rocket_meals_module_workflows_disable : BackendTranslationKeys.rocket_meals_module_workflows_enable)" @click.stop="toggleEnabled(item)" @keydown.enter.stop>
                <span class="track" />
              </button>
            </div>

            <ul class="facts dim">
              <li :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule)">
                <v-icon name="schedule" x-small />
                <span>{{ scheduleLabel(item) }}</span>
              </li>
              <li v-if="!item.registered || item.schedule?.cron" :title="translate(BackendTranslationKeys.rocket_meals_module_workflows_next_run)">
                <v-icon name="update" x-small />
                <span v-if="!item.registered" class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_not_registered) }}</span>
                <span v-else-if="!item.enabled" class="muted">{{ translate(BackendTranslationKeys.rocket_meals_module_workflows_paused) }}</span>
                <span v-else-if="nextRunOf(item)"
                  >{{ relative(nextRunOf(item)) }} <span class="muted">· {{ pointInTime(nextRunOf(item)) }}</span></span
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

            <div class="tile-foot">
              <button class="play" :disabled="!WorkflowsPageHelper.canStart(item)" :title="startTooltip(item)" :aria-label="startTooltip(item)" @click.stop="onPlay(item)" @keydown.enter.stop>
                <v-icon :name="item.health === WorkflowHealth.RUNNING ? 'hourglass_top' : 'play_arrow'" filled />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <workflow-start-dialog v-model="startDialog.open" :workflow-name="nameOf(startDialog.workflowId)" :initial-input="startDialog.initialInput" @start="start(startDialog.workflowId, $event)" />
  </private-view>
</template>

<style scoped>
.workflows {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: var(--content-padding);
  padding-block-start: 0;
}

.search {
  inline-size: 16rem;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  align-items: center;
}

.stat {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.stat b,
.up-next b {
  color: var(--theme--foreground-accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.up-next {
  margin-inline-start: auto;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

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

.sort {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.empty {
  padding: 3rem 1rem;
  text-align: center;
  border: var(--theme--border-width) dashed var(--theme--border-color);
  border-radius: var(--theme--border-radius);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
  gap: 1rem;
}

.tile {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  min-inline-size: 0;
  padding: 1.25rem;
  background: var(--theme--background-subdued);
  border: var(--theme--border-width) solid var(--theme--border-color-subdued);
  border-radius: var(--theme--border-radius);
  cursor: pointer;
  transition: border-color var(--fast) var(--transition);
}

.tile:hover,
.tile:focus-visible {
  border-color: var(--theme--primary);
}

.tile.inactive .dim {
  opacity: 0.55;
}

.tile-icon {
  position: relative;
  flex: none;
  align-self: flex-start;
  --v-icon-color: var(--theme--primary);
}

/* The traffic light sits on the corner of the icon. */
.tile-dot {
  position: absolute;
  inset-block-end: -0.125rem;
  inset-inline-end: -0.25rem;
  box-shadow: 0 0 0 2px var(--theme--background-subdued);
}

.tile-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
  min-inline-size: 0;
}

.tile-head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.tile-name {
  flex: 1;
  min-inline-size: 0;
}

.name {
  overflow-wrap: anywhere;
}

.workflow-id {
  font-family: var(--theme--fonts--monospace--font-family, monospace);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}

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

.tile-foot {
  display: flex;
  justify-content: flex-end;
  margin-block-start: auto;
}

.switch {
  flex: none;
  padding: 0.25rem;
  background: none;
  cursor: pointer;
}

.track {
  position: relative;
  display: block;
  inline-size: 2.25rem;
  block-size: 1.25rem;
  background: var(--theme--border-color);
  border-radius: 1rem;
  transition: background var(--fast) var(--transition);
}

.track::after {
  position: absolute;
  inset-block-start: 2px;
  inset-inline-start: 2px;
  inline-size: calc(1.25rem - 4px);
  block-size: calc(1.25rem - 4px);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform var(--fast) var(--transition);
  content: '';
}

.switch[aria-checked='true'] .track {
  background: var(--theme--primary);
}

.switch[aria-checked='true'] .track::after {
  transform: translateX(1rem);
}

.play {
  display: grid;
  place-items: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  color: var(--foreground-inverted, #fff);
  background: var(--theme--primary);
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--fast) var(--transition);
}

.play:hover:not(:disabled) {
  transform: scale(1.06);
}

.play:disabled {
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-normal);
  cursor: not-allowed;
}

@media (max-width: 40rem) {
  .search {
    inline-size: 10rem;
  }

  .up-next {
    margin-inline-start: 0;
    inline-size: 100%;
  }
}
</style>
