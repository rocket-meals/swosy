import {FoodsAttributesValues, WorkflowsRuns} from "../databaseTypes/types";

export type WorkflowRunInformationForSchedule = {
    alias?: string | null;
    result_hash?: string | null;
    log?: string | null;
    output?: string | null;
}

export type ResultPrioritizePendingJobs = {
    delelePendingJobs: WorkflowsRuns[];
    workflowRunToCheck: WorkflowsRuns;
}

export type ResultHandleOtherJobsAlreadyRunning = {
    validWorkflowRunsToTrigger: WorkflowsRuns[];

}

export class WorkflowSortHelper {
    static getMostRecentWorkflowRun(workflowsRuns: WorkflowsRuns[]): WorkflowsRuns | undefined {
        let output = workflowsRuns;
        output = this.sortWorkflowsRunsByDateCreated(output);
        if(output.length > 0){
            return output[output.length - 1];
        }
        return undefined;
    }

    static sortWorkflowsRunsByDateCreated(workflowsRuns: WorkflowsRuns[]): WorkflowsRuns[] {
        let output = workflowsRuns;
        output.sort((a,b) => {
            let dateA = undefined
            if(!!a.date_created){
                dateA = new Date(a.date_created);
            }
            let dateB = undefined
            if(!!b.date_created){
                dateB = new Date(b.date_created);
            }
            if(!!dateA && !!dateB){
                return dateA.getTime() - dateB.getTime();
            } else if (!!dateA){
                return -1;
            } else if (!!dateB){
                return 1;
            } else {
                return 0;
            }
        });
        return output;
    }
}

export interface WorkflowRunJobInterface {

    getWorkflowId(): string;

    prioritizePendingList(workflowRuns: WorkflowsRuns[]): Promise<ResultPrioritizePendingJobs>;

    handleOtherJobAlreadyRunning(workflowRun: WorkflowsRuns): Promise<VALID_WORKFLOW_RUN_STATES_WHEN_PENDING_AND_ANOTHER_WORKFLOW_RUN_IS_RUNNING>;

    getWorkflowRunInformationBefore(workflowRun: WorkflowsRuns): Promise<WorkflowRunInformationForSchedule>;

    getWorkflowRunInformationAfter(workflowRun: WorkflowsRuns): Promise<WorkflowRunInformationForSchedule>;

    runJob(workflowRun: WorkflowsRuns): Promise<void>;

}
