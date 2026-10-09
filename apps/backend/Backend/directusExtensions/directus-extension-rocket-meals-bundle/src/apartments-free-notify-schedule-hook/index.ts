import { CronObject, DatabaseTypes } from 'repo-depkit-common';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { FreeApartmentsNotifier } from './FreeApartmentsNotifier';

const HOOK_NAME = 'apartments-free-notify-schedule';

/** Once a day in the evening, all new free apartments of the day in one notification. */
const EVERY_DAY_AT_18: CronObject = {
  seconds: 0,
  minutes: 0,
  hours: 18,
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

class ApartmentsFreeNotifyWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return 'apartments-free-notify';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    try {
      const notifier = new FreeApartmentsNotifier(context.myDatabaseHelper);
      const result = await notifier.notify(message => context.logger.appendLog(message));
      return context.logger.getFinalLogWithStateAndParams({
        state: result.failedProfiles > 0 ? WORKFLOW_RUN_STATE.FAILED : WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ schedule }, apiContext) => {
  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new ApartmentsFreeNotifyWorkflow(),
    myDatabaseHelper: new MyDatabaseHelper(apiContext),
    schedule: schedule,
    cronOject: EVERY_DAY_AT_18,
  });
});
