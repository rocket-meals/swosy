import { NewsParseSchedule } from './NewsParseSchedule';
import { DemoNewsParser } from './DemoNewsParser';
import { NewsParserInterface } from './NewsParserInterface';
import { EnvVariableHelper, SyncForCustomerEnum } from '../helpers/EnvVariableHelper';
import { StudentenwerkHannoverNewsParser } from './hannover/StudentenwerkHannoverNewsParser';
import { StudentenwerkOsnabrueckNewsParser } from './osnabrueck/StudentenwerkOsnabrueckNewsParser';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { DatabaseTypes, CronHelper } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {MyDefineHook} from "../helpers/MyDefineHook";
const HOOK_NAME = 'news-sync';

class NewsParseWorkflow extends SingleWorkflowRun {
  private readonly newsParserInterface: NewsParserInterface;

  constructor(newsParserInterface: NewsParserInterface) {
    super();
    this.newsParserInterface = newsParserInterface;
  }

  getWorkflowId(): string {
    return 'news-sync';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting sync news parsing');
    try {
      const parseSchedule = new NewsParseSchedule(context, this.newsParserInterface);
      return await parseSchedule.parse();
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME,async ({ action, init, schedule }, apiContext) => {
  let usedParser: NewsParserInterface | null = null;
  switch (EnvVariableHelper.getSyncForCustomer()) {
    case SyncForCustomerEnum.TEST:
      usedParser = new DemoNewsParser();
      break;
    case SyncForCustomerEnum.HANNOVER:
      usedParser = new StudentenwerkHannoverNewsParser();
      break;
    case SyncForCustomerEnum.OSNABRUECK:
      usedParser = new StudentenwerkOsnabrueckNewsParser();
      break;
  }

  if (!usedParser) {
    return;
  }

  let myDatabaseHelper = new MyDatabaseHelper(apiContext);
  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new NewsParseWorkflow(usedParser),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_4AM,
  });
});
