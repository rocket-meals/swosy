import { ParseSchedule } from './ParseSchedule';
import { defineHook } from '@directus/extensions-sdk';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { DatabaseTypes } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {CronHelper, CronObject} from "repo-depkit-common";
import {MyDefineHook} from "../helpers/MyDefineHook";
const HOOK_NAME = 'utilization-canteen-hook';
class UtilizationCanteenCalculationWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return 'utilization-canteen-calculation';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting utilization canteen calculation');

    try {
      const parseSchedule = new ParseSchedule(context);
      return await parseSchedule.parse();
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME,async ({ init, action, schedule }, apiContext) => {
  let myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new UtilizationCanteenCalculationWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_15_MINUTES,
  });
});
