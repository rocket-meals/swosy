import {ApartmentsParseSchedule} from "./ApartmentsParseSchedule";
import {StudentenwerkHannoverApartments_Parser} from "./hannover/StudentenwerkHannoverApartments_Parser";
import {defineHook} from "@directus/extensions-sdk";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {ApartmentParserInterface} from "./ApartmentParserInterface";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper} from "../workflows-runs-hook";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface,
    WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";

class HousingSyncWorkflow implements WorkflowRunJobInterface {

    private parserInterface: ApartmentParserInterface;

    constructor(parserInterface: ApartmentParserInterface) {
        this.parserInterface = parserInterface;
    }

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "housing-sync";
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
        await logger.appendLog("Starting sync housing parsing");
        try{
            const parseSchedule = new ApartmentsParseSchedule(workflowRun, myDatabaseHelper, logger, this.parserInterface);
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
    let usedParser: ApartmentParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = null;
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = new StudentenwerkHannoverApartments_Parser()
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = null
            break;
    }

    if(usedParser === null){
        return;
    }

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);
    WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
        workflowRunInterface: new HousingSyncWorkflow(usedParser),
        myDatabaseHelper: myDatabaseHelper,
        schedule: schedule,
        cronOject: WorkflowScheduleHelper.EVERY_DAY_AT_4AM,
    });
});
