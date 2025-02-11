import {NewsParseSchedule} from "./NewsParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {DemoNews_Parser} from "./DemoNews_Parser";
import {NewsParserInterface} from "./NewsParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {StudentenwerkHannoverNews_Parser} from "./hannover/StudentenwerkHannoverNews_Parser";
import {StudentenwerkOsnabrueckNews_Parser} from "./osnabrueck/StudentenwerkOsnabrueckNews_Parser";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper, WorkflowScheduler} from "../workflows-runs-hook";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface,
    WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";


class NewsParseWorkflow implements WorkflowRunJobInterface {

    private newsParserInterface: NewsParserInterface;

    constructor(newsParserInterface: NewsParserInterface) {
        this.newsParserInterface = newsParserInterface;
    }

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "news-sync";
    }

    handleWorkflowRunsWantToRun(modifiableInput: Partial<WorkflowsRuns>, workflowruns: Partial<WorkflowsRuns>[], alreadyRunningWorkflowruns: WorkflowsRuns[]): ResultHandleWorkflowRunsWantToRun {
        let answer: ResultHandleWorkflowRunsWantToRun = {
            errorMessage: undefined,
        }

        // We only want one workflow run at a time
        if(workflowruns.length > 1){
            answer.errorMessage = "Cannot start more than one workflow run at a time";
        }
        if(alreadyRunningWorkflowruns.length > 0){
            answer.errorMessage = "A workflow run is already running";
        }

        //modifiableInput.state = WORKFLOW_RUN_STATE.RUNNING;

        return answer;

    }

    async runJob(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper, logger: WorkflowRunLogger): Promise<Partial<WorkflowsRuns>> {
        await logger.appendLog("Starting sync news parsing");
        try{
            const parseSchedule = new NewsParseSchedule(workflowRun, myDatabaseHelper, logger, this.newsParserInterface);
            return await parseSchedule.parse();
        } catch (err: any) {
            await logger.appendLog("Error: " + err.toString());
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.FAILED,
            })
        }

    }

}

export default defineHook(async ({action, init, schedule}, apiContext) => {
    let usedParser: NewsParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = new DemoNews_Parser();
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = new StudentenwerkHannoverNews_Parser()
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new StudentenwerkOsnabrueckNews_Parser()
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
        cronOject: WorkflowScheduleHelper.EVERY_DAY_AT_4AM,
    });
});
