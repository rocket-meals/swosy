/**
 * WorkflowsActions.ts – reads and writes of the page "Workflows": load the overview, start a run,
 * switch a workflow on or off. Everything goes through Directus with the permissions of the
 * person looking at the page; starting is creating a `workflows_runs` row with `state: running`,
 * which `workflows-runs-hook` picks up (and refuses for a disabled or already running workflow).
 *
 * Takes the Directus app's API client (`useApi()`) as parameter, so it has no Vue imports.
 */

import { WorkflowsPageHelper, type WorkflowOverviewItem, type WorkflowRow, type WorkflowRunRow, type WorkflowScheduleInfo, type WorkflowsQuery, type WorkflowsSchedulesResponse } from './WorkflowsPageHelper';

/** The part of the Directus app's axios instance used here. */
export type WorkflowsApiClient = {
  get: (url: string, config?: { params?: WorkflowsQuery }) => Promise<{ data?: any }>;
  post: (url: string, data?: unknown) => Promise<{ data?: any }>;
  patch: (url: string, data?: unknown) => Promise<{ data?: any }>;
};

export class WorkflowsActions {
  static async loadOverview(api: WorkflowsApiClient): Promise<WorkflowOverviewItem[]> {
    const [workflows, lastRuns, running, schedules] = await Promise.all([api.get(WorkflowsPageHelper.WORKFLOWS_ENDPOINT, { params: WorkflowsPageHelper.buildWorkflowsQuery() }), api.get(WorkflowsPageHelper.WORKFLOWS_RUNS_ENDPOINT, { params: WorkflowsPageHelper.buildLastRunsQuery() }), api.get(WorkflowsPageHelper.WORKFLOWS_RUNS_ENDPOINT, { params: WorkflowsPageHelper.buildRunningQuery() }), WorkflowsActions.loadSchedules(api)]);
    return WorkflowsPageHelper.buildOverview({
      workflows: (workflows.data?.data ?? []) as WorkflowRow[],
      schedules,
      lastRuns: WorkflowsPageHelper.readLastRuns(lastRuns.data?.data),
      running: WorkflowsPageHelper.readRunning(running.data?.data),
    });
  }

  /** `undefined` when the server does not answer (e.g. an older bundle) – the page still works without "next run". */
  static async loadSchedules(api: WorkflowsApiClient): Promise<WorkflowScheduleInfo[] | undefined> {
    try {
      const response = await api.get(WorkflowsPageHelper.SCHEDULES_ENDPOINT);
      return ((response.data as WorkflowsSchedulesResponse | undefined)?.data ?? []) as WorkflowScheduleInfo[];
    } catch (error) {
      console.error('[rocket-meals-module] loading workflow schedules failed', error);
      return undefined;
    }
  }

  static async loadRuns(api: WorkflowsApiClient, query: WorkflowsQuery): Promise<{ runs: WorkflowRunRow[]; total: number }> {
    const response = await api.get(WorkflowsPageHelper.WORKFLOWS_RUNS_ENDPOINT, { params: query });
    const runs = (response.data?.data ?? []) as WorkflowRunRow[];
    const total = Number(response.data?.meta?.filter_count ?? runs.length);
    return { runs, total: Number.isFinite(total) ? total : runs.length };
  }

  static async loadRun(api: WorkflowsApiClient, runId: string): Promise<WorkflowRunRow | undefined> {
    const response = await api.get(`${WorkflowsPageHelper.WORKFLOWS_RUNS_ENDPOINT}/${encodeURIComponent(runId)}`, { params: WorkflowsPageHelper.buildRunQuery() });
    return response.data?.data as WorkflowRunRow | undefined;
  }

  static async start(api: WorkflowsApiClient, workflowId: string, input: string | null): Promise<void> {
    await api.post(WorkflowsPageHelper.WORKFLOWS_RUNS_ENDPOINT, WorkflowsPageHelper.buildStartPayload(workflowId, input));
  }

  static async setEnabled(api: WorkflowsApiClient, workflowId: string, enabled: boolean): Promise<void> {
    await api.patch(`${WorkflowsPageHelper.WORKFLOWS_ENDPOINT}/${encodeURIComponent(workflowId)}`, { enabled });
  }

  /** The message Directus sends back (e.g. "Workflow with id: … is not enabled"), else the error itself. */
  static getErrorMessage(error: unknown): string {
    const response = (error as { response?: { data?: { errors?: { message?: string }[] } } })?.response;
    const message = response?.data?.errors?.[0]?.message;
    if (message) {
      return message;
    }
    return error instanceof Error ? error.message : String(error);
  }
}
