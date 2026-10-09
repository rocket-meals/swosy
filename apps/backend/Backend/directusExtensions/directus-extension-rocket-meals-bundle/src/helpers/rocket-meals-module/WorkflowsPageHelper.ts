/**
 * WorkflowsPageHelper.ts – data side of the page "Workflows" (`workflows-page.vue`,
 * `workflow-detail-page.vue`): which workflows exist, whether their last real run went through,
 * when they fire next, and the runs of one workflow.
 *
 * Sources:
 * - `workflows` (`enabled`) and `workflows_runs` – read and written with the permissions of the
 *   person looking at the page. A new run with `state: running` is started by `workflows-runs-hook`.
 * - `GET /rocket-meals-workflows/schedules` (`workflows-schedules-endpoint`) – the cron strings live
 *   in the code of the hooks, not in the database, so the server reports them with the next runs.
 *
 * Workflow names are static texts in the backend catalogue (`workflow_name_*`), keyed by workflow id:
 * they only change together with the code that registers the workflow, so they need no table.
 *
 * No Vue in here, so the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import type { TranslationParams } from 'repo-depkit-common/src/translations';
import { CronScheduleHelper } from '../CronScheduleHelper';
import { WORKFLOW_RUN_STATE } from '../itemServiceHelpers/WorkflowsRunEnum';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

type DirectusFilter = Record<string, unknown>;

export type WorkflowsQuery = {
  fields?: string;
  filter?: string;
  sort?: string;
  limit?: number;
  page?: number;
  aggregate?: string;
  groupBy?: string;
  meta?: string;
};

/** One entry of `GET /rocket-meals-workflows/schedules`. */
export type WorkflowScheduleInfo = {
  workflow_id: string;
  /** `null`: no schedule, the workflow only runs when started by hand. */
  cron: string | null;
  /** ISO timestamps, ascending, computed by the server in its own time zone. */
  next_runs: string[];
  /** JSON prefilled when the workflow is started by hand, if it expects an input. */
  input_template: string | null;
};

export type WorkflowsSchedulesResponse = {
  data: WorkflowScheduleInfo[];
};

export type WorkflowRow = {
  id: string;
  alias?: string | null;
  enabled?: boolean | null;
};

export type WorkflowRunUser = { id?: string; first_name?: string | null; last_name?: string | null; email?: string | null };

export type WorkflowRunRow = {
  id: string;
  workflow?: string | { id: string } | null;
  state?: string | null;
  date_created?: string | null;
  date_started?: string | null;
  date_finished?: string | null;
  runtime_in_seconds?: number | null;
  user_created?: string | WorkflowRunUser | null;
  log?: string | null;
  input?: unknown;
  output?: unknown;
  result_hash?: unknown;
};

/** The traffic light of a tile. */
export enum WorkflowHealth {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  /** No finished run that did something yet. */
  NEVER = 'never',
}

/** Latest start per finished state of one workflow, from the aggregate query. */
export type WorkflowLastRuns = {
  successAt?: string;
  failedAt?: string;
};

export type WorkflowOverviewItem = {
  id: string;
  enabled: boolean;
  /** Set up on this server – otherwise a run cannot start (e.g. a sync of another customer). */
  registered: boolean;
  schedule?: WorkflowScheduleInfo;
  health: WorkflowHealth;
  lastSuccessAt?: string;
  runningSince?: string;
};

export enum WorkflowsFilter {
  ALL = 'all',
  PROBLEMS = 'problems',
  RUNNING = 'running',
  DISABLED = 'disabled',
}

export enum WorkflowsSort {
  AUTOMATIC = 'automatic',
  NEXT_RUN = 'next_run',
  NAME = 'name',
}

export enum WorkflowRunsFilter {
  ALL = 'all',
  FAILED = 'failed',
  SUCCESS = 'success',
  RUNNING = 'running',
}

export type WorkflowRunStats = {
  /** Finished runs that did something (success or failed) in the loaded list. */
  count: number;
  /** Percent of those without error, `undefined` without any. */
  successRate?: number;
  averageRuntimeSeconds?: number;
};

type Translate = (key: BackendTranslationKeys, params?: TranslationParams) => string;

export class WorkflowsPageHelper {
  public static readonly SCHEDULES_ENDPOINT = '/rocket-meals-workflows/schedules';
  public static readonly WORKFLOWS_ENDPOINT = `/items/${CollectionNames.WORKFLOWS}`;
  public static readonly WORKFLOWS_RUNS_ENDPOINT = `/items/${CollectionNames.WORKFLOWS_RUNS}`;

  /** While a run is going, the page looks again this often. */
  public static readonly REFRESH_WHILE_RUNNING_MS = 5_000;
  /** Otherwise the status is refreshed this often (the order of the tiles stays as it is). */
  public static readonly REFRESH_INTERVAL_MS = 60_000;
  public static readonly RUNS_PAGE_SIZE = 25;
  public static readonly UPCOMING_RUNS = 5;

  /** Cleans up after all others – listed last among the enabled workflows. */
  public static readonly WORKFLOWS_RUNS_CLEANUP_ID = 'workflows-runs-cleanup';

  public static readonly RUN_LIST_FIELDS = ['id', 'state', 'date_created', 'date_started', 'date_finished', 'runtime_in_seconds', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];
  public static readonly RUN_DETAIL_FIELDS = ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];

  /** Name of every workflow the bundle registers. An id missing here is shown as it is. */
  public static readonly WORKFLOW_NAME_KEYS: Readonly<Record<string, BackendTranslationKeys>> = {
    'app-reviews-pull': BackendTranslationKeys.workflow_name_app_reviews_pull,
    'app-usage-events-cleanup': BackendTranslationKeys.workflow_name_app_usage_events_cleanup,
    'cashregister-parse': BackendTranslationKeys.workflow_name_cashregister_parse,
    'collectible-events-repeat': BackendTranslationKeys.workflow_name_collectible_events_repeat,
    'feature-wishes-cleanup': BackendTranslationKeys.workflow_name_feature_wishes_cleanup,
    'feature-wishes-daily': BackendTranslationKeys.workflow_name_feature_wishes_daily,
    'file-cleanup': BackendTranslationKeys.workflow_name_file_cleanup,
    'food-image-ai-generation': BackendTranslationKeys.workflow_name_food_image_ai_generation,
    'food-notify': BackendTranslationKeys.workflow_name_food_notify,
    'food-sync': BackendTranslationKeys.workflow_name_food_sync,
    'foods-translation-fix-missing': BackendTranslationKeys.workflow_name_foods_translation_fix_missing,
    'housing-contract-sync-hannover': BackendTranslationKeys.workflow_name_housing_contract_sync_hannover,
    'housing-sync': BackendTranslationKeys.workflow_name_housing_sync,
    'news-sync': BackendTranslationKeys.workflow_name_news_sync,
    'users-inactive-cleanup': BackendTranslationKeys.workflow_name_users_inactive_cleanup,
    'utilization-canteen-calculation': BackendTranslationKeys.workflow_name_utilization_canteen_calculation,
    'washingmachines-parse': BackendTranslationKeys.workflow_name_washingmachines_parse,
    'workflows-runs-cleanup': BackendTranslationKeys.workflow_name_workflows_runs_cleanup,
  };

  /** Icon of the tile (Material Symbols, as everywhere in Directus). An id missing here gets the page icon. */
  public static readonly WORKFLOW_ICONS: Readonly<Record<string, string>> = {
    'app-reviews-pull': 'reviews',
    'app-usage-events-cleanup': 'auto_delete',
    'cashregister-parse': 'point_of_sale',
    'collectible-events-repeat': 'event_repeat',
    'feature-wishes-cleanup': 'cleaning_services',
    'feature-wishes-daily': 'lightbulb',
    'file-cleanup': 'folder_delete',
    'food-image-ai-generation': 'auto_awesome',
    'food-notify': 'notifications_active',
    'food-sync': 'restaurant_menu',
    'foods-translation-fix-missing': 'translate',
    'housing-contract-sync-hannover': 'contract',
    'housing-sync': 'apartment',
    'news-sync': 'newspaper',
    'users-inactive-cleanup': 'person_remove',
    'utilization-canteen-calculation': 'groups',
    'washingmachines-parse': 'local_laundry_service',
    'workflows-runs-cleanup': 'history_toggle_off',
  };

  public static readonly DEFAULT_WORKFLOW_ICON = 'account_tree';

  static getIcon(workflowId: string): string {
    return WorkflowsPageHelper.WORKFLOW_ICONS[workflowId] ?? WorkflowsPageHelper.DEFAULT_WORKFLOW_ICON;
  }

  static getName(workflowId: string, translate: Translate): string {
    const key = WorkflowsPageHelper.WORKFLOW_NAME_KEYS[workflowId];
    return key ? translate(key) : workflowId;
  }

  static buildWorkflowsQuery(): WorkflowsQuery {
    return { fields: 'id,alias,enabled', limit: -1 };
  }

  /** Latest start per workflow and finished state – skipped runs did nothing and do not count. */
  static buildLastRunsQuery(): WorkflowsQuery {
    return {
      aggregate: JSON.stringify({ max: 'date_started' }),
      groupBy: 'workflow,state',
      filter: JSON.stringify({ state: { _in: [WORKFLOW_RUN_STATE.SUCCESS, WORKFLOW_RUN_STATE.FAILED] } }),
      limit: -1,
    };
  }

  static buildRunningQuery(): WorkflowsQuery {
    return {
      fields: 'id,workflow,date_started,date_created',
      filter: JSON.stringify({ state: { _eq: WORKFLOW_RUN_STATE.RUNNING } }),
      limit: -1,
    };
  }

  static readLastRuns(data: unknown): Map<string, WorkflowLastRuns> {
    const result = new Map<string, WorkflowLastRuns>();
    for (const row of Array.isArray(data) ? data : []) {
      const workflowId = WorkflowsPageHelper.getWorkflowId((row as WorkflowRunRow).workflow);
      const date = (row as { max?: { date_started?: string | null } }).max?.date_started;
      if (!workflowId || !date) {
        continue;
      }
      const entry = result.get(workflowId) ?? {};
      const state = (row as WorkflowRunRow).state;
      if (state === WORKFLOW_RUN_STATE.SUCCESS) {
        entry.successAt = date;
      } else if (state === WORKFLOW_RUN_STATE.FAILED) {
        entry.failedAt = date;
      }
      result.set(workflowId, entry);
    }
    return result;
  }

  /** Earliest start per workflow among the running runs. */
  static readRunning(data: unknown): Map<string, string> {
    const result = new Map<string, string>();
    for (const row of Array.isArray(data) ? (data as WorkflowRunRow[]) : []) {
      const workflowId = WorkflowsPageHelper.getWorkflowId(row.workflow);
      const since = row.date_started ?? row.date_created ?? '';
      if (!workflowId) {
        continue;
      }
      const known = result.get(workflowId);
      if (known === undefined || (since && since < known)) {
        result.set(workflowId, since);
      }
    }
    return result;
  }

  static getWorkflowId(workflow: WorkflowRunRow['workflow']): string | undefined {
    if (!workflow) {
      return undefined;
    }
    return typeof workflow === 'string' ? workflow : workflow.id;
  }

  /** Running wins, otherwise whether the latest run that did something went through. */
  static getHealth(lastRuns: WorkflowLastRuns | undefined, running: boolean): WorkflowHealth {
    if (running) {
      return WorkflowHealth.RUNNING;
    }
    const successAt = lastRuns?.successAt ? new Date(lastRuns.successAt).getTime() : undefined;
    const failedAt = lastRuns?.failedAt ? new Date(lastRuns.failedAt).getTime() : undefined;
    if (successAt === undefined && failedAt === undefined) {
      return WorkflowHealth.NEVER;
    }
    if (failedAt !== undefined && (successAt === undefined || failedAt > successAt)) {
      return WorkflowHealth.FAILED;
    }
    return WorkflowHealth.SUCCESS;
  }

  /** `schedules` is `undefined` when the server could not report them – then every workflow counts as set up. */
  static buildOverview(options: { workflows: WorkflowRow[]; schedules: WorkflowScheduleInfo[] | undefined; lastRuns: Map<string, WorkflowLastRuns>; running: Map<string, string> }): WorkflowOverviewItem[] {
    const schedules = new Map((options.schedules ?? []).map(schedule => [schedule.workflow_id, schedule]));
    return options.workflows.map(workflow => {
      const lastRuns = options.lastRuns.get(workflow.id);
      const running = options.running.has(workflow.id);
      return {
        id: workflow.id,
        // Same rule as the schedule (`if (enabled)`): only `true` fires.
        enabled: workflow.enabled === true,
        registered: options.schedules === undefined || schedules.has(workflow.id),
        schedule: schedules.get(workflow.id),
        health: WorkflowsPageHelper.getHealth(lastRuns, running),
        lastSuccessAt: lastRuns?.successAt,
        runningSince: running ? options.running.get(workflow.id) || undefined : undefined,
      };
    });
  }

  /** Can be started right now: enabled, set up on this server and not already running. */
  static canStart(item: WorkflowOverviewItem): boolean {
    return item.enabled && item.registered && item.health !== WorkflowHealth.RUNNING;
  }

  /** Why the start button is greyed out, `undefined` when it is not. */
  static getStartBlockedReasonKey(item: WorkflowOverviewItem): BackendTranslationKeys | undefined {
    if (!item.registered) {
      return BackendTranslationKeys.rocket_meals_module_workflows_not_registered;
    }
    if (!item.enabled) {
      return BackendTranslationKeys.rocket_meals_module_workflows_start_disabled_hint;
    }
    if (item.health === WorkflowHealth.RUNNING) {
      return BackendTranslationKeys.rocket_meals_module_workflows_start_running_hint;
    }
    return undefined;
  }

  /** Disabled and not set up on this server: nothing to look after – they go to the end. */
  static isInactive(item: WorkflowOverviewItem): boolean {
    return !item.enabled || !item.registered;
  }

  static isProblem(item: WorkflowOverviewItem): boolean {
    return !WorkflowsPageHelper.isInactive(item) && item.health === WorkflowHealth.FAILED;
  }

  static matchesFilter(item: WorkflowOverviewItem, filter: WorkflowsFilter): boolean {
    switch (filter) {
      case WorkflowsFilter.PROBLEMS:
        return WorkflowsPageHelper.isProblem(item);
      case WorkflowsFilter.RUNNING:
        return item.health === WorkflowHealth.RUNNING;
      case WorkflowsFilter.DISABLED:
        return WorkflowsPageHelper.isInactive(item);
      default:
        return true;
    }
  }

  static matchesSearch(item: WorkflowOverviewItem, name: string, search: string): boolean {
    const needle = search.trim().toLowerCase();
    return !needle || name.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle);
  }

  /** The first scheduled run that still lies ahead, `undefined` for a disabled or manual workflow. */
  static getNextRun(item: WorkflowOverviewItem, now: Date): Date | undefined {
    if (!item.enabled) {
      return undefined;
    }
    return WorkflowsPageHelper.getUpcomingRuns(item, now)[0];
  }

  static getUpcomingRuns(item: WorkflowOverviewItem, now: Date): Date[] {
    return (item.schedule?.next_runs ?? []).map(run => new Date(run)).filter(run => run.getTime() > now.getTime());
  }

  /**
   * The order of the tiles, as workflow ids. Computed once when the page opens (and when the sort is
   * changed by hand) – never after a click, so a tile does not jump away under the mouse.
   *
   * Automatic: failed ones first, then the other enabled ones, then disabled / not set up. Inside a
   * group alphabetically by name; `workflows-runs-cleanup` is the last enabled one.
   */
  static sort(items: WorkflowOverviewItem[], sort: WorkflowsSort, getName: (id: string) => string, now: Date): string[] {
    const byName = (a: WorkflowOverviewItem, b: WorkflowOverviewItem) => getName(a.id).localeCompare(getName(b.id));
    const sorted = [...items];
    if (sort === WorkflowsSort.NAME) {
      sorted.sort(byName);
    } else if (sort === WorkflowsSort.NEXT_RUN) {
      const next = (item: WorkflowOverviewItem) => WorkflowsPageHelper.getNextRun(item, now)?.getTime() ?? Number.POSITIVE_INFINITY;
      sorted.sort((a, b) => next(a) - next(b) || byName(a, b));
    } else {
      const group = (item: WorkflowOverviewItem) => {
        if (WorkflowsPageHelper.isInactive(item)) {
          return 3;
        }
        if (WorkflowsPageHelper.isProblem(item)) {
          return 0;
        }
        return item.id === WorkflowsPageHelper.WORKFLOWS_RUNS_CLEANUP_ID ? 2 : 1;
      };
      sorted.sort((a, b) => group(a) - group(b) || byName(a, b));
    }
    return sorted.map(item => item.id);
  }

  /** Items in the given order; workflows that showed up after the order was computed go to the end. */
  static applyOrder(items: WorkflowOverviewItem[], order: string[]): WorkflowOverviewItem[] {
    const position = new Map(order.map((id, index) => [id, index]));
    return [...items].sort((a, b) => (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }

  static buildRunsQuery(workflowId: string, filter: WorkflowRunsFilter, limit: number): WorkflowsQuery {
    const conditions: DirectusFilter[] = [{ workflow: { _eq: workflowId } }];
    if (filter === WorkflowRunsFilter.FAILED) {
      conditions.push({ state: { _eq: WORKFLOW_RUN_STATE.FAILED } });
    } else if (filter === WorkflowRunsFilter.SUCCESS) {
      conditions.push({ state: { _in: [WORKFLOW_RUN_STATE.SUCCESS, WORKFLOW_RUN_STATE.SKIPPED] } });
    } else if (filter === WorkflowRunsFilter.RUNNING) {
      conditions.push({ state: { _eq: WORKFLOW_RUN_STATE.RUNNING } });
    }
    return {
      fields: WorkflowsPageHelper.RUN_LIST_FIELDS.join(','),
      filter: JSON.stringify({ _and: conditions }),
      sort: '-date_created',
      limit,
      meta: 'filter_count',
    };
  }

  static buildRunQuery(): WorkflowsQuery {
    return { fields: WorkflowsPageHelper.RUN_DETAIL_FIELDS.join(',') };
  }

  /** New run of a workflow – `workflows-runs-hook` starts it right after it was created. */
  static buildStartPayload(workflowId: string, input: string | null): { workflow: string; state: string; input?: string } {
    return { workflow: workflowId, state: WORKFLOW_RUN_STATE.RUNNING, ...(input ? { input } : {}) };
  }

  /** Empty is fine (no input), anything else has to be valid JSON. */
  static parseInput(text: string): { ok: true; input: string | null } | { ok: false } {
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: true, input: null };
    }
    try {
      JSON.parse(trimmed);
      return { ok: true, input: trimmed };
    } catch {
      return { ok: false };
    }
  }

  /** The input of a run as text for the input field when it is started again. */
  static inputToText(input: unknown): string {
    if (input === null || input === undefined) {
      return '';
    }
    return typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  }

  /** Text for the tabs of a run: JSON pretty printed, plain text as it is. */
  static formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed, null, 2) : value;
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  }

  /** A log line of `WorkflowRunLogger` is `<ISO date>: <text>`. */
  static splitLogLine(line: string): { date?: Date; text: string; error: boolean } {
    const match = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z): (.*)$/.exec(line);
    const text = match?.[2] ?? line;
    const date = match?.[1] ? new Date(match[1]) : undefined;
    return { date, text, error: /\berror\b|\bfailed\b|\bexception\b/i.test(text) };
  }

  static getRunStats(runs: WorkflowRunRow[]): WorkflowRunStats {
    const finished = runs.filter(run => run.state === WORKFLOW_RUN_STATE.SUCCESS || run.state === WORKFLOW_RUN_STATE.FAILED);
    if (finished.length === 0) {
      return { count: 0 };
    }
    const successful = finished.filter(run => run.state === WORKFLOW_RUN_STATE.SUCCESS).length;
    const runtimes = finished.map(run => run.runtime_in_seconds).filter((runtime): runtime is number => typeof runtime === 'number');
    return {
      count: finished.length,
      successRate: Math.round((successful / finished.length) * 100),
      averageRuntimeSeconds: runtimes.length ? Math.round(runtimes.reduce((sum, runtime) => sum + runtime, 0) / runtimes.length) : undefined,
    };
  }

  static getRunStateLabelKey(state: string | null | undefined): BackendTranslationKeys {
    switch (state) {
      case WORKFLOW_RUN_STATE.SUCCESS:
        return BackendTranslationKeys.rocket_meals_module_workflows_state_success;
      case WORKFLOW_RUN_STATE.FAILED:
        return BackendTranslationKeys.rocket_meals_module_workflows_state_failed;
      case WORKFLOW_RUN_STATE.RUNNING:
        return BackendTranslationKeys.rocket_meals_module_workflows_state_running;
      case WORKFLOW_RUN_STATE.SKIPPED:
        return BackendTranslationKeys.rocket_meals_module_workflows_state_skipped;
      default:
        return BackendTranslationKeys.rocket_meals_module_workflows_state_unknown;
    }
  }

  static getHealthLabelKey(health: WorkflowHealth): BackendTranslationKeys {
    switch (health) {
      case WorkflowHealth.RUNNING:
        return BackendTranslationKeys.rocket_meals_module_workflows_health_running;
      case WorkflowHealth.SUCCESS:
        return BackendTranslationKeys.rocket_meals_module_workflows_health_success;
      case WorkflowHealth.FAILED:
        return BackendTranslationKeys.rocket_meals_module_workflows_health_failed;
      default:
        return BackendTranslationKeys.rocket_meals_module_workflows_health_never;
    }
  }

  /** Who started a run: a person, or `undefined` for the schedule / the server. */
  static getStartedBy(run: WorkflowRunRow): string | undefined {
    const user = run.user_created;
    if (!user || typeof user !== 'object') {
      return undefined;
    }
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    return name || user.email || undefined;
  }

  /** "Täglich um 04:00", "Alle 5 Minuten", … – the cron string itself when the pattern is unusual. */
  static describeSchedule(cron: string | null | undefined, language: string | undefined, translate: Translate): string {
    if (!cron) {
      return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_manual);
    }
    const description = CronScheduleHelper.describe(cron);
    const time = (hour: number, minute: number) => new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(2026, 0, 1, hour, minute));
    switch (description.kind) {
      case 'every_minute':
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_every_minute);
      case 'every_minutes':
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_every_minutes, { minutes: description.minutes });
      case 'hourly':
        return description.minute === 0 ? translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_hourly) : translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_hourly_at, { minute: description.minute });
      case 'daily':
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_daily, { time: time(description.hour, description.minute) });
      case 'weekly': {
        // 4 January 2026 is a Sunday – weekday 0 in cron as in `Date`.
        const weekday = new Intl.DateTimeFormat(language, { weekday: 'long' }).format(new Date(2026, 0, 4 + description.weekday));
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_weekly, { weekday, time: time(description.hour, description.minute) });
      }
      case 'monthly':
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_monthly, { day: description.day, time: time(description.hour, description.minute) });
      default:
        return translate(BackendTranslationKeys.rocket_meals_module_workflows_schedule_custom, { cron });
    }
  }

  /** "4 min 12 s", "1 h 5 min", "12 s" – a duration in the user's language. */
  static formatDuration(seconds: number | null | undefined, language: string | undefined): string {
    if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
      return '–';
    }
    const unit = (value: number, name: 'hour' | 'minute' | 'second') => new Intl.NumberFormat(language, { style: 'unit', unit: name, unitDisplay: 'narrow' }).format(value);
    const total = Math.max(0, Math.round(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const rest = total % 60;
    if (hours > 0) {
      return [unit(hours, 'hour'), minutes ? unit(minutes, 'minute') : ''].filter(Boolean).join(' ');
    }
    if (minutes > 0) {
      return [unit(minutes, 'minute'), rest ? unit(rest, 'second') : ''].filter(Boolean).join(' ');
    }
    return unit(rest, 'second');
  }

  /** "in 4 Minuten", "vor 2 Stunden" – rounded to the largest sensible unit. */
  static formatRelative(date: Date | string | null | undefined, now: Date, language: string | undefined): string {
    const time = date ? new Date(date).getTime() : Number.NaN;
    if (Number.isNaN(time)) {
      return '';
    }
    const seconds = Math.round((time - now.getTime()) / 1000);
    const absolute = Math.abs(seconds);
    const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    if (absolute < 60) {
      return formatter.format(seconds, 'second');
    }
    if (absolute < 3600) {
      return formatter.format(Math.trunc(seconds / 60), 'minute');
    }
    if (absolute < 86_400) {
      return formatter.format(Math.trunc(seconds / 3600), 'hour');
    }
    return formatter.format(Math.round(seconds / 86_400), 'day');
  }

  /** "14:00" today, "Sa., 04:00" within a week, otherwise "01.11., 01:00" – short enough for a tile. */
  static formatPointInTime(date: Date | string | null | undefined, now: Date, language: string | undefined): string {
    if (!date) {
      return '';
    }
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
      return '';
    }
    const time: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    if (value.toDateString() === now.toDateString()) {
      return new Intl.DateTimeFormat(language, time).format(value);
    }
    const withinAWeek = Math.abs(value.getTime() - now.getTime()) < 6 * 86_400_000;
    const day: Intl.DateTimeFormatOptions = withinAWeek ? { weekday: 'short' } : { day: '2-digit', month: '2-digit' };
    return new Intl.DateTimeFormat(language, { ...day, ...time }).format(value);
  }
}
