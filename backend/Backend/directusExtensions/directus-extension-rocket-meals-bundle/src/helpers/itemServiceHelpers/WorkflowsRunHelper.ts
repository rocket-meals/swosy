import {WorkflowsRuns} from "../../databaseTypes/types";
import {ItemsServiceHelper} from "../ItemsServiceHelper";
import {WorkflowRunLogger} from "../../workflows-runs-hook/WorkflowRunJobInterface";
import {WORKFLOW_RUN_STATE} from "./WorkflowsRunEnum";

export class WorkflowsRunHelper extends ItemsServiceHelper<WorkflowsRuns> {

    async getPreviousResultHash(workflowRun: WorkflowsRuns, logger: WorkflowRunLogger): Promise<string | null | undefined> {

        // we need to search in workflowruns for the last successful run of this schedule and get the result_hash
        // if there is no successful run, we return null
        let workflowId: string | undefined;
        if(!!workflowRun){
            if(typeof workflowRun.workflow === "string"){
                workflowId = workflowRun.workflow;
            } else {
                workflowId = workflowRun.workflow.id;
            }
        }

        if(!workflowId){
            return null;
        }

        return await this.readByQuery({
            filter: {
                workflow: {
                    _eq: workflowId
                },
                date_finished: {
                    _nempty: true // not empty
                },
                state: {
                    _eq: WORKFLOW_RUN_STATE.SUCCESS // only successful runs
                },
                result_hash: {
                    _nempty: true // not empty
                },
            },
            fields: ['*'],
            sort: ['-date_finished'], // sort by date_finished descending order - so we get the latest run first
            limit: 1
        }).then((workflowRuns) => {
            let workflowRun = workflowRuns[0];
            if(!!workflowRun){
                return workflowRun.result_hash;
            }
            return null;
        }).catch(async (err) => {
            await logger.appendLog("Error while getting previous result hash: " + err.toString());
            return null;
        });
    }

}
