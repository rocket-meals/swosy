import { ParseSchedule } from './ParseSchedule';
import { Cashregisters_SWOSY } from './Cashregisters_SWOSY';
import { defineHook } from '@directus/extensions-sdk';
import { EnvVariableHelper, SyncForCustomerEnum } from '../helpers/EnvVariableHelper';
import { CashregisterTransactionParserInterface } from './CashregisterTransactionParserInterface';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { DatabaseTypes } from 'repo-depkit-common';
import { WorkflowScheduleHelper, WorkflowScheduler } from '../workflows-runs-hook';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {CronHelper, CronObject} from "repo-depkit-common";
import {MyDefineHook} from "../helpers/MyDefineHook";

const HOOK_NAME = 'cashregister-hook';

class CashRegisterWorkflow extends SingleWorkflowRun {
  private readonly usedParser: CashregisterTransactionParserInterface;

  constructor(usedParser: CashregisterTransactionParserInterface) {
    super();
    this.usedParser = usedParser;
  }

  getWorkflowId(): string {
    return 'cashregister-parse';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting cashregister parsing');

    const parseSchedule = new ParseSchedule(context, this.usedParser);

    try {
      return await parseSchedule.parse();
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME,async ({ action, init, filter, schedule }, apiContext) => {
  let usedParser: CashregisterTransactionParserInterface | null = null;
  let cronObject: CronObject | null = null;

  switch (EnvVariableHelper.getSyncForCustomer()) {
    case SyncForCustomerEnum.TEST:
      usedParser = null;
      break;
    case SyncForCustomerEnum.HANNOVER:
      usedParser = null;
      break;
    case SyncForCustomerEnum.OSNABRUECK:
      usedParser = new Cashregisters_SWOSY('https://share.sw-os.de/swosy-kassendaten-2h', `Nils:qYoTHeyPyRljfEGRWW52`);
      cronObject = CronHelper.EVERY_HOUR;
      break;
  }

  if (!usedParser) {
    return;
  }

  if (!cronObject) {
    return;
  }

  let myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduler.registerWorkflow(new CashRegisterWorkflow(usedParser));

  WorkflowScheduleHelper.registerScheduleToCreateWorkflowRuns({
    workflowId: 'cashregister-parse',
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: cronObject,
  });
});
