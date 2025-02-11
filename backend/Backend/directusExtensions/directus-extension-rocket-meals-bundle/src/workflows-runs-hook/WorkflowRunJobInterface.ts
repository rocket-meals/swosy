import {WorkflowsRuns} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE} from "./index";

export type ResultHandleWorkflowRunsWantToRun = {
    errorMessage: string | undefined
}

export class WorkflowRunLogger {

    private workflowRun: WorkflowsRuns;
    private myDatabaseHelper: MyDatabaseHelper;
    private currentLog: string = "";

    constructor(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper) {
        this.workflowRun = workflowRun;
        this.myDatabaseHelper = myDatabaseHelper;
        this.currentLog = workflowRun.log || "";
    }

    async setLog(workflowRunId: string, log: string) {
        this.myDatabaseHelper.getWorkflowsRunsHelper().updateOneWithoutHookTrigger(workflowRunId, {
            log: log,
        });
    }

    static createLogRow(log: string) {
        return new Date().toISOString() + ": " + log + "\n";
    }

    async appendLog(log: string) {
        this.currentLog += WorkflowRunLogger.createLogRow(log);
        await this.setLog(this.workflowRun.id, this.currentLog);
    }

    getFinalLogWithStateAndParams(workflowrun: Partial<WorkflowsRuns>): Partial<WorkflowsRuns> {
        let result: Partial<WorkflowsRuns> = {
            log: this.currentLog,
            ...workflowrun
        }
        return result;
    }
}

export interface WorkflowRunJobInterface {

    getWorkflowId(): string;

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined;
    getDeleteFailedWorkflowRunsAfterDays(): number | undefined;

    handleWorkflowRunsWantToRun(modifiableInput: Partial<WorkflowsRuns>, workflowruns: Partial<WorkflowsRuns>[], alreadyRunningWorkflowruns: WorkflowsRuns[]): ResultHandleWorkflowRunsWantToRun;

    runJob(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper, logger: WorkflowRunLogger): Promise<Partial<WorkflowsRuns>>;

}
