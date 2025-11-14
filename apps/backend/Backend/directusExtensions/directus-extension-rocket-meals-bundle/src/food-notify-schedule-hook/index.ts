import { defineHook } from '@directus/extensions-sdk';
import { NotifySchedule } from './NotifySchedule';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { DatabaseTypes } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {CronHelper, CronObject} from "repo-depkit-common";
import {MyDefineHook} from "../helpers/MyDefineHook";
const HOOK_NAME = 'food-notify-schedule';

class FoodNotifyWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return 'food-notify';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting food parsing');

    try {
      const notifySchedule = new NotifySchedule(context);
      let aboutMealsInDays = 1;
      return await notifySchedule.notify(aboutMealsInDays);
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME,async ({ action, schedule }, apiContext) => {
  let myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FoodNotifyWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_17_59,
  });
});
