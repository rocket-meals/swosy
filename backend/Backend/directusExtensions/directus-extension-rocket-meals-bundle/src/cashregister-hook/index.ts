import {ParseSchedule} from "./ParseSchedule"
import {Cashregisters_SWOSY} from "./Cashregisters_SWOSY"
import {defineHook} from "@directus/extensions-sdk";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {CashregisterTransactionParserInterface} from "./CashregisterTransactionParserInterface";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface,
    WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper, WorkflowScheduler} from "../workflows-runs-hook";


class CashRegisterWorkflow implements WorkflowRunJobInterface {

    private usedParser: CashregisterTransactionParserInterface;

    constructor(usedParser: CashregisterTransactionParserInterface) {
        this.usedParser = usedParser;
    }

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "cashregister-parse";
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
        await logger.appendLog("Starting cashregister parsing");

        const parseSchedule = new ParseSchedule(workflowRun, myDatabaseHelper, logger, this.usedParser);

        try {
            return await parseSchedule.parse();
        } catch (err: any) {
            await logger.appendLog("Error: " + err.toString());
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.FAILED,
            })
        }
    }

}

export default defineHook(async ({action, init, filter, schedule}, apiContext) => {
    let usedParser: CashregisterTransactionParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = null;
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = null;
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new Cashregisters_SWOSY("https://share.sw-os.de/swosy-kassendaten-2h", `Nils:qYoTHeyPyRljfEGRWW52`);
            break;
    }

    if (!usedParser) {
        return;
    }



    let myDatabaseHelper = new MyDatabaseHelper(apiContext);

    WorkflowScheduler.registerWorkflow(new CashRegisterWorkflow(usedParser))

    WorkflowScheduleHelper.registerScheduleToCreateWorkflowRuns({
        workflowId: "cashregister-parse",
        myDatabaseHelper: myDatabaseHelper,
        schedule: schedule,
        cronOject: WorkflowScheduleHelper.EVERY_DAY_AT_17_59,
    });
});
