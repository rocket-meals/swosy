import { CronHelper, DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ItemsServiceCreator } from '../helpers/ItemsServiceCreator';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { APP_USAGE_EVENTS_CLEANUP_WORKFLOW_ID, APP_USAGE_EVENTS_COLLECTION, AppUsageEventsCleanupHelper } from './AppUsageEventsCleanupHelper';

const SCHEDULE_NAME = 'app-usage-events-cleanup-schedule';

/** Deletes `app_usage_events` older than 30 days, every night in batches. */
class AppUsageEventsCleanupWorkflow extends SingleWorkflowRun {
  constructor(private readonly itemsServiceCreator: ItemsServiceCreator) {
    super();
  }

  getWorkflowId(): string {
    return APP_USAGE_EVENTS_CLEANUP_WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    try {
      const cutoff = AppUsageEventsCleanupHelper.getCutoffDate(new Date());
      const filter = AppUsageEventsCleanupHelper.buildFilter(cutoff);
      await context.logger.appendLog('Deleting app_usage_events older than ' + AppUsageEventsCleanupHelper.MAX_AGE_DAYS + ' days (before ' + cutoff.toISOString() + ')');

      const itemsService = await this.itemsServiceCreator.getItemsService<{ id: string }>(APP_USAGE_EVENTS_COLLECTION);
      let totalDeleted = 0;
      let iteration = 0;
      while (iteration < AppUsageEventsCleanupHelper.MAX_ITERATIONS) {
        iteration++;
        const batch = await itemsService.readByQuery({ filter, fields: ['id'], limit: AppUsageEventsCleanupHelper.BATCH_SIZE });
        if (batch.length === 0) {
          break;
        }
        await itemsService.deleteMany(batch.map(event => event.id));
        totalDeleted += batch.length;
        if (batch.length < AppUsageEventsCleanupHelper.BATCH_SIZE) {
          break;
        }
      }
      if (iteration >= AppUsageEventsCleanupHelper.MAX_ITERATIONS) {
        await context.logger.appendLog('Reached the maximum of ' + AppUsageEventsCleanupHelper.MAX_ITERATIONS + ' batches, the rest follows with the next run.');
      }
      await context.logger.appendLog('Deleted ' + totalDeleted + ' app_usage_events');
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SUCCESS });
    } catch (err: unknown) {
      await context.logger.appendLog('Error: ' + String(err));
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.FAILED });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ schedule }, apiContext) => {
  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new AppUsageEventsCleanupWorkflow(new ItemsServiceCreator(apiContext)),
    myDatabaseHelper: new MyDatabaseHelper(apiContext),
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_4AM,
  });
});
