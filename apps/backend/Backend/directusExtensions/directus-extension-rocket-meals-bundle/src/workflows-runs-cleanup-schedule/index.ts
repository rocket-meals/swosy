import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {WorkflowScheduleHelper} from '../workflows-runs-hook';
import {SingleWorkflowRun} from '../workflows-runs-hook/WorkflowRunJobInterface';
import {CronHelper, DatabaseTypes} from 'repo-depkit-common';
import {WORKFLOW_RUN_STATE} from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {WorkflowRunContext} from '../helpers/WorkflowRunContext';
import {MyDefineHook} from '../helpers/MyDefineHook';

const SCHEDULE_NAME = 'workflows-runs-cleanup-schedule';
const MAX_AGE_DAYS = 31;

class WorkflowsRunsCleanupWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return 'workflows-runs-cleanup';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting workflows_runs cleanup');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
      const cutoffDateISO = cutoffDate.toISOString();

      await context.logger.appendLog('Deleting workflow_runs older than ' + MAX_AGE_DAYS + ' days (before ' + cutoffDateISO + ')');

      const workflowsRunsHelper = context.myDatabaseHelper.getWorkflowsRunsHelper();

      const oldWorkflowRuns = await workflowsRunsHelper.readByQuery({
        filter: {
          _and: [
            {
              date_created: {
                _lte: cutoffDateISO,
              },
            },
            {
              state: {
                _neq: WORKFLOW_RUN_STATE.RUNNING,
              },
            },
          ],
        },
        fields: ['id'],
        limit: -1,
      });

      await context.logger.appendLog('Found ' + oldWorkflowRuns.length + ' old workflow_runs to delete');

      let deletedCount = 0;
      for (const workflowRun of oldWorkflowRuns) {
        try {
          await workflowsRunsHelper.deleteOne(workflowRun.id);
          deletedCount++;
        } catch (err: any) {
          await context.logger.appendLog('Error deleting workflow_run ' + workflowRun.id + ': ' + err.toString());
        }
      }

      await context.logger.appendLog('Successfully deleted ' + deletedCount + ' workflow_runs');

      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({schedule}, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new WorkflowsRunsCleanupWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_4AM,
  });
});
