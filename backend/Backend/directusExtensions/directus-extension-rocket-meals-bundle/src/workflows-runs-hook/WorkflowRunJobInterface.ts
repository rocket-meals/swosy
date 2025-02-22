import {WorkflowsRuns} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE} from "../helpers/itemServiceHelpers/WorkflowsRunEnum";

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

/**
 * This class checks, that only one workflow run is running at a time
 */
/**
 * This abstract class ensures that only one workflow run is running at a time.
 * It does not fully implement WorkflowRunJobInterface, requiring subclasses to complete it.
 */
/**
 * This abstract class ensures that only one workflow run is running at a time.
 * Subclasses must implement the missing methods from WorkflowRunJobInterface.
 */
export abstract class SingleWorkflowRun implements WorkflowRunJobInterface {

    /**
     * Ensures that only one workflow run is running at a time.
     */
    handleWorkflowRunsWantToRun(
        modifiableInput: Partial<WorkflowsRuns>,
        workflowruns: Partial<WorkflowsRuns>[],
        alreadyRunningWorkflowruns: WorkflowsRuns[]
    ): ResultHandleWorkflowRunsWantToRun {

        let answer: ResultHandleWorkflowRunsWantToRun = {
            errorMessage: undefined,
        };

        // Ensure only one workflow run starts at a time
        if (workflowruns.length > 1) {
            answer.errorMessage = "Cannot start more than one workflow run at a time";
            return answer;
        }

        if (alreadyRunningWorkflowruns.length > 0) {
            answer.errorMessage = "A workflow run is already running";
            return answer;
        }

        // Update the state of the workflow run if no error occurred
        modifiableInput.state = WORKFLOW_RUN_STATE.RUNNING;

        return answer;
    }

    /**
     * These methods are required by WorkflowRunJobInterface,
     * but they are left abstract so subclasses must implement them.
     */
    abstract getWorkflowId(): string;
    abstract runJob(workflowRun: WorkflowsRuns, myDatabaseHelper: MyDatabaseHelper, logger: WorkflowRunLogger): Promise<Partial<WorkflowsRuns>>;

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }
}

