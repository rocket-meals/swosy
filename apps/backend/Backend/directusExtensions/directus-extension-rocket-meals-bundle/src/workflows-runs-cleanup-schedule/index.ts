import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {WorkflowScheduleHelper} from '../workflows-runs-hook';
import {SingleWorkflowRun} from '../workflows-runs-hook/WorkflowRunJobInterface';
import {CronHelper, DatabaseTypes} from 'repo-depkit-common';
import {WORKFLOW_RUN_STATE} from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {WorkflowRunContext} from '../helpers/WorkflowRunContext';
import {MyDefineHook} from '../helpers/MyDefineHook';

const SCHEDULE_NAME = 'workflows-runs-cleanup-schedule';
const MAX_AGE_DAYS = 31;
const BATCH_SIZE = 500;
const MAX_ITERATIONS = 20;

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

      const filter = {
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
      };

      let totalDeletedCount = 0;
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const batch = await workflowsRunsHelper.readByQuery({
          filter,
          fields: ['id'],
          limit: BATCH_SIZE,
        });

        if (batch.length === 0) {
          await context.logger.appendLog('No more old workflow_runs found. Stopping after ' + iteration + ' iteration(s).');
          break;
        }

        const ids = batch.map(run => run.id);
        await context.logger.appendLog('Iteration ' + iteration + '/' + MAX_ITERATIONS + ': deleting ' + ids.length + ' workflow_runs');
        await workflowsRunsHelper.deleteMany(ids);
        totalDeletedCount += ids.length;

        if (batch.length < BATCH_SIZE) {
          await context.logger.appendLog('Last batch was smaller than ' + BATCH_SIZE + '. Stopping after ' + iteration + ' iteration(s).');
          break;
        }
      }

      if (iteration >= MAX_ITERATIONS) {
        await context.logger.appendLog('Reached maximum of ' + MAX_ITERATIONS + ' iterations. There may be more old workflow_runs remaining.');
      }

      await context.logger.appendLog('Successfully deleted ' + totalDeletedCount + ' workflow_runs in total');

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
