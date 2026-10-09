import { describe, expect, it } from '@jest/globals';
import { WorkflowHealth, WorkflowRunsFilter, WorkflowsFilter, WorkflowsPageHelper, WorkflowsSort, type WorkflowOverviewItem } from '../WorkflowsPageHelper';
import { BackendTranslator } from '../../translations/BackendTranslator';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';
import { RocketMealsModulePages } from '../RocketMealsModulePages';

const NOW = new Date(2026, 9, 8, 10, 42, 30);
const translateDe = (key: BackendTranslationKeys, params?: Record<string, string | number>) => BackendTranslator.translate(key, 'de', params);

function item(id: string, overrides: Partial<WorkflowOverviewItem> = {}): WorkflowOverviewItem {
  return { id, enabled: true, registered: true, health: WorkflowHealth.SUCCESS, ...overrides };
}

describe('WorkflowsPageHelper', () => {
  describe('getHealth', () => {
    it('is red when the latest run that did something failed, green when it went through', () => {
      expect(WorkflowsPageHelper.getHealth({ successAt: '2026-10-08T08:00:00Z', failedAt: '2026-10-08T09:00:00Z' }, false)).toBe(WorkflowHealth.FAILED);
      expect(WorkflowsPageHelper.getHealth({ successAt: '2026-10-08T09:00:00Z', failedAt: '2026-10-08T08:00:00Z' }, false)).toBe(WorkflowHealth.SUCCESS);
      expect(WorkflowsPageHelper.getHealth({ failedAt: '2026-10-08T08:00:00Z' }, false)).toBe(WorkflowHealth.FAILED);
    });

    it('shows running first and "never" without any finished run', () => {
      expect(WorkflowsPageHelper.getHealth({ failedAt: '2026-10-08T08:00:00Z' }, true)).toBe(WorkflowHealth.RUNNING);
      expect(WorkflowsPageHelper.getHealth(undefined, false)).toBe(WorkflowHealth.NEVER);
    });
  });

  describe('readLastRuns', () => {
    it('reads the aggregate rows per workflow and state', () => {
      const lastRuns = WorkflowsPageHelper.readLastRuns([
        { workflow: 'food-sync', state: 'success', max: { date_started: '2026-10-08T08:00:00Z' } },
        { workflow: 'food-sync', state: 'failed', max: { date_started: '2026-10-07T08:00:00Z' } },
        { workflow: { id: 'news-sync' }, state: 'failed', max: { date_started: '2026-10-08T04:00:00Z' } },
        { workflow: null, state: 'failed', max: { date_started: '2026-10-08T04:00:00Z' } },
      ]);
      expect(lastRuns.get('food-sync')).toEqual({ successAt: '2026-10-08T08:00:00Z', failedAt: '2026-10-07T08:00:00Z' });
      expect(lastRuns.get('news-sync')).toEqual({ failedAt: '2026-10-08T04:00:00Z' });
      expect(lastRuns.size).toBe(2);
    });

    it('skips skipped runs in the query', () => {
      expect(JSON.parse(WorkflowsPageHelper.buildLastRunsQuery().filter ?? '{}')).toEqual({ state: { _in: ['success', 'failed'] } });
    });
  });

  describe('sort', () => {
    const items = [item('workflows-runs-cleanup'), item('news-sync', { health: WorkflowHealth.FAILED }), item('food-sync'), item('food-image-ai-generation', { enabled: false, health: WorkflowHealth.FAILED }), item('housing-contract-sync-hannover', { registered: false }), item('app-reviews-pull', { health: WorkflowHealth.RUNNING }), item('file-cleanup', { health: WorkflowHealth.FAILED })];
    const getName = (id: string) => WorkflowsPageHelper.getName(id, translateDe);

    it('automatic: problems, then enabled alphabetically, workflows-runs-cleanup last, then disabled', () => {
      expect(WorkflowsPageHelper.sort(items, WorkflowsSort.AUTOMATIC, getName, NOW)).toEqual([
        'file-cleanup', // Dateien aufräumen
        'news-sync', // News synchronisieren
        'food-sync', // Speiseplan synchronisieren
        'app-reviews-pull', // Store-Bewertungen abrufen
        'workflows-runs-cleanup',
        'food-image-ai-generation', // Speisebilder mit KI erzeugen
        'housing-contract-sync-hannover', // Wohnheimverträge Hannover synchronisieren
      ]);
    });

    it('keeps the order, new workflows go to the end', () => {
      const ordered = WorkflowsPageHelper.applyOrder([item('b'), item('new'), item('a')], ['a', 'b']);
      expect(ordered.map(entry => entry.id)).toEqual(['a', 'b', 'new']);
    });

    it('next run: soonest first, manual and disabled last', () => {
      const soon = item('soon', { schedule: { workflow_id: 'soon', cron: '* * * * *', next_runs: [new Date(NOW.getTime() + 60_000).toISOString()], input_template: null } });
      const later = item('later', { schedule: { workflow_id: 'later', cron: '* * * * *', next_runs: [new Date(NOW.getTime() + 3_600_000).toISOString()], input_template: null } });
      const off = item('off', { enabled: false, schedule: { workflow_id: 'off', cron: '* * * * *', next_runs: [new Date(NOW.getTime() + 1_000).toISOString()], input_template: null } });
      expect(WorkflowsPageHelper.sort([off, later, item('manual'), soon], WorkflowsSort.NEXT_RUN, id => id, NOW)).toEqual(['soon', 'later', 'manual', 'off']);
    });
  });

  describe('filters and start', () => {
    it('counts disabled and not set up workflows as inactive, not as problem', () => {
      const disabled = item('a', { enabled: false, health: WorkflowHealth.FAILED });
      expect(WorkflowsPageHelper.matchesFilter(disabled, WorkflowsFilter.DISABLED)).toBe(true);
      expect(WorkflowsPageHelper.matchesFilter(disabled, WorkflowsFilter.PROBLEMS)).toBe(false);
      expect(WorkflowsPageHelper.matchesFilter(item('b', { registered: false }), WorkflowsFilter.DISABLED)).toBe(true);
    });

    it('only starts an enabled, set up workflow that is not running', () => {
      expect(WorkflowsPageHelper.canStart(item('a'))).toBe(true);
      expect(WorkflowsPageHelper.getStartBlockedReasonKey(item('a', { enabled: false }))).toBe(BackendTranslationKeys.rocket_meals_module_workflows_start_disabled_hint);
      expect(WorkflowsPageHelper.getStartBlockedReasonKey(item('a', { health: WorkflowHealth.RUNNING }))).toBe(BackendTranslationKeys.rocket_meals_module_workflows_start_running_hint);
      expect(WorkflowsPageHelper.getStartBlockedReasonKey(item('a', { registered: false }))).toBe(BackendTranslationKeys.rocket_meals_module_workflows_not_registered);
    });

    it('treats every workflow as set up when the schedules could not be loaded', () => {
      const overview = WorkflowsPageHelper.buildOverview({ workflows: [{ id: 'a', enabled: true }], schedules: undefined, lastRuns: new Map(), running: new Map([['a', '2026-10-08T08:00:00Z']]) });
      expect(overview).toEqual([{ id: 'a', enabled: true, registered: true, schedule: undefined, health: WorkflowHealth.RUNNING, lastSuccessAt: undefined, runningSince: '2026-10-08T08:00:00Z' }]);
    });

    it('counts a workflow as enabled only when enabled is true, like the schedule does', () => {
      const overview = WorkflowsPageHelper.buildOverview({
        workflows: [
          { id: 'on', enabled: true },
          { id: 'off', enabled: false },
          { id: 'unset', enabled: null },
        ],
        schedules: [],
        lastRuns: new Map(),
        running: new Map(),
      });
      expect(overview.map(entry => [entry.id, entry.enabled, entry.registered])).toEqual([
        ['on', true, false],
        ['off', false, false],
        ['unset', false, false],
      ]);
    });

    it('keeps points in time short', () => {
      expect(WorkflowsPageHelper.formatPointInTime(new Date(2026, 9, 8, 14, 45), NOW, 'de')).toBe('14:45');
      expect(WorkflowsPageHelper.formatPointInTime(new Date(2026, 9, 10, 4, 0), NOW, 'de')).toBe('Sa., 04:00');
      expect(WorkflowsPageHelper.formatPointInTime(new Date(2026, 10, 1, 1, 0), NOW, 'de')).toBe('01.11., 01:00');
    });

    it('starts a run with state running and an optional input', () => {
      expect(WorkflowsPageHelper.buildStartPayload('food-sync', null)).toEqual({ workflow: 'food-sync', state: 'running' });
      expect(WorkflowsPageHelper.buildStartPayload('users-inactive-cleanup', '{"delete_users":false}')).toEqual({ workflow: 'users-inactive-cleanup', state: 'running', input: '{"delete_users":false}' });
    });

    it('accepts empty input and valid JSON only', () => {
      expect(WorkflowsPageHelper.parseInput('  ')).toEqual({ ok: true, input: null });
      expect(WorkflowsPageHelper.parseInput('{"a": 1}')).toEqual({ ok: true, input: '{"a": 1}' });
      expect(WorkflowsPageHelper.parseInput('{a: 1}')).toEqual({ ok: false });
    });
  });

  describe('runs', () => {
    it('filters runs of one workflow, newest first', () => {
      const query = WorkflowsPageHelper.buildRunsQuery('food-sync', WorkflowRunsFilter.SUCCESS, 25);
      expect(JSON.parse(query.filter ?? '{}')).toEqual({ _and: [{ workflow: { _eq: 'food-sync' } }, { state: { _in: ['success', 'skipped'] } }] });
      expect(query.sort).toBe('-date_created');
      expect(query.limit).toBe(25);
    });

    it('counts success rate and runtime over finished runs only', () => {
      expect(
        WorkflowsPageHelper.getRunStats([
          { id: '1', state: 'success', runtime_in_seconds: 10 },
          { id: '2', state: 'failed', runtime_in_seconds: 20 },
          { id: '3', state: 'skipped', runtime_in_seconds: 1 },
          { id: '4', state: 'running' },
          { id: '5', state: 'success', runtime_in_seconds: 30 },
          { id: '6', state: 'success', runtime_in_seconds: null },
        ])
      ).toEqual({ count: 4, successRate: 75, averageRuntimeSeconds: 20 });
      expect(WorkflowsPageHelper.getRunStats([])).toEqual({ count: 0 });
    });

    it('splits a log line of WorkflowRunLogger and marks errors', () => {
      expect(WorkflowsPageHelper.splitLogLine('2026-10-08T08:00:01.123Z: Workflow Run started')).toEqual({ date: new Date('2026-10-08T08:00:01.123Z'), text: 'Workflow Run started', error: false });
      expect(WorkflowsPageHelper.splitLogLine('Error: something broke').error).toBe(true);
    });

    it('names the person who started a run, nobody for the schedule', () => {
      expect(WorkflowsPageHelper.getStartedBy({ id: '1', user_created: { first_name: 'Ada', last_name: 'Lovelace' } })).toBe('Ada Lovelace');
      expect(WorkflowsPageHelper.getStartedBy({ id: '1', user_created: { email: 'ada@example.org' } })).toBe('ada@example.org');
      expect(WorkflowsPageHelper.getStartedBy({ id: '1', user_created: null })).toBeUndefined();
    });

    it('pretty prints JSON values and keeps plain text', () => {
      expect(WorkflowsPageHelper.formatValue('{"a":1}')).toBe('{\n  "a": 1\n}');
      expect(WorkflowsPageHelper.formatValue({ a: 1 })).toBe('{\n  "a": 1\n}');
      expect(WorkflowsPageHelper.formatValue('plain')).toBe('plain');
      expect(WorkflowsPageHelper.formatValue(null)).toBe('');
    });
  });

  describe('texts', () => {
    it('has a translated name for every known workflow and falls back to the id', () => {
      for (const [workflowId, key] of Object.entries(WorkflowsPageHelper.WORKFLOW_NAME_KEYS)) {
        expect(WorkflowsPageHelper.getName(workflowId, translateDe)).toBe(BackendTranslator.translate(key, 'de'));
      }
      expect(WorkflowsPageHelper.getName('food-sync', translateDe)).toBe('Speiseplan synchronisieren');
      expect(WorkflowsPageHelper.getName('unknown-workflow', translateDe)).toBe('unknown-workflow');
    });

    it('has an icon for every named workflow and falls back to the page icon', () => {
      expect(Object.keys(WorkflowsPageHelper.WORKFLOW_ICONS).sort()).toEqual(Object.keys(WorkflowsPageHelper.WORKFLOW_NAME_KEYS).sort());
      expect(WorkflowsPageHelper.getIcon('food-sync')).toBe('restaurant_menu');
      expect(WorkflowsPageHelper.getIcon('unknown-workflow')).toBe(RocketMealsModulePages.WORKFLOWS.icon);
    });

    it('describes schedules in words', () => {
      expect(WorkflowsPageHelper.describeSchedule('0 */5 * * * *', 'de', translateDe)).toBe('Alle 5 Minuten');
      expect(WorkflowsPageHelper.describeSchedule('0 0 4 * * *', 'de', translateDe)).toBe('Täglich um 04:00');
      expect(WorkflowsPageHelper.describeSchedule('0 0 1 1 * *', 'de', translateDe)).toBe('Monatlich am 1. um 01:00');
      expect(WorkflowsPageHelper.describeSchedule('0 0 8 * * 5', 'de', translateDe)).toBe('Jeden Freitag um 08:00');
      expect(WorkflowsPageHelper.describeSchedule(null, 'de', translateDe)).toBe('Nur manuell');
      expect(WorkflowsPageHelper.describeSchedule('0 15,45 * * * *', 'de', translateDe)).toBe('Zeitplan 0 15,45 * * * *');
    });

    it('formats durations', () => {
      expect(WorkflowsPageHelper.formatDuration(12, 'en')).toBe('12s');
      expect(WorkflowsPageHelper.formatDuration(252, 'en')).toBe('4m 12s');
      expect(WorkflowsPageHelper.formatDuration(3900, 'en')).toBe('1h 5m');
      expect(WorkflowsPageHelper.formatDuration(null, 'en')).toBe('–');
    });

    it('is a page of the module', () => {
      expect(RocketMealsModulePages.PAGES).toContain(RocketMealsModulePages.WORKFLOWS);
      expect(RocketMealsModulePages.getRoute(RocketMealsModulePages.WORKFLOWS, 'food-sync')).toBe('/rocket-meals/workflows/food-sync');
    });
  });
});
