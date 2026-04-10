import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { DatabaseTypes } from 'repo-depkit-common';

const SCHEDULE_NAME = 'workflows_runs_log_cleanup';

const DAYS_TO_KEEP_LOGS = 60;

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ schedule }, apiContext) => {
  const cronFrequency = '0 3 * * *'; // every day at 3 AM

  schedule(cronFrequency, async () => {
    apiContext.logger.info(SCHEDULE_NAME + ': start schedule run: ' + new Date().toISOString());

    try {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const workflowsRunsHelper = myDatabaseHelper.getWorkflowsRunsHelper();

      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(now.getDate() - DAYS_TO_KEEP_LOGS);
      const cutoffDateISO = cutoffDate.toISOString();

      apiContext.logger.info(SCHEDULE_NAME + ': clearing logs for workflow_runs older than ' + cutoffDateISO);

      const oldRunsWithLog: DatabaseTypes.WorkflowsRuns[] = await workflowsRunsHelper.readByQuery({
        filter: {
          _and: [
            {
              date_created: {
                _lte: cutoffDateISO,
              },
            },
            {
              log: {
                _null: false,
              },
            },
          ],
        },
        fields: ['id'],
        limit: -1,
      });

      apiContext.logger.info(SCHEDULE_NAME + ': found ' + oldRunsWithLog.length + ' workflow_runs with logs to clear');

      if (oldRunsWithLog.length > 0) {
        const update: Partial<DatabaseTypes.WorkflowsRuns> = {
          log: null,
        };
        await workflowsRunsHelper.updateManyByItems(oldRunsWithLog, update);
        apiContext.logger.info(SCHEDULE_NAME + ': cleared logs for ' + oldRunsWithLog.length + ' workflow_runs');
      }
    } catch (e) {
      apiContext.logger.error(SCHEDULE_NAME + ': error during log cleanup: ' + e);
    }
  });
});
