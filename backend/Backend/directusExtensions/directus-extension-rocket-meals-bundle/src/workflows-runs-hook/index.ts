import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {Workflows, WorkflowsRuns, WorkflowsSettings} from "../databaseTypes/types";
import {CronHelper} from "../helpers/CronHelper";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {WorkflowsSettingsStatus} from "../helpers/itemServiceHelpers/WorkflowsSettingsHelper";
import {PrimaryKey} from "@directus/types";
import {DictHelper} from "../helpers/DictHelper";
import {WorkflowRunJobInterface} from "./WorkflowRunJobInterface";

const SCHEDULE_NAME = "workflows_hook";

export class WorkflowScheduler {
    private static registeredWorkflows: { [p: string]: WorkflowRunJobInterface } = {};

    static registerWorkflow(workflowRunJobInterface: WorkflowRunJobInterface): void {
        let workflowId = workflowRunJobInterface.getWorkflowId();
        if(!!WorkflowScheduler.registeredWorkflows[workflowId]){
            throw new Error("Workflow with id: "+workflowId+" is already registered.");
        }
        WorkflowScheduler.registeredWorkflows[workflowRunJobInterface.getWorkflowId()] = workflowRunJobInterface;
    }

    static getRegisteredWorkflow(workflowId: string): WorkflowRunJobInterface | undefined {
        return WorkflowScheduler.registeredWorkflows[workflowId];
    }
}

export enum WORKFLOW_RUN_STATE {
    PENDING = "pending", // muss noch ausgeführt werden
//    CHECKING = "checking",
    RUNNING = "running", // ein workflow run wird gerade ausgeführt, in der regel nur einer pro workflow
    SUCCESS = "success",
    FAILED = "failed",
    SKIPPED = "skipped",
    DELETE = "delete"
}


function cleanWorkflowRun(input: Partial<WorkflowsRuns>): Partial<WorkflowsRuns> {
    input.log = null;
    input.output = null;
    input.date_finished = null;
    input.date_started = null;

    return input;
}

async function doesAnotherWorkflowRunExistWhichIsCheckingOrRunning(workflowId: string, myDatabaseHelper: MyDatabaseHelper): Promise<boolean> {
    let searchWorkflowRuns: Partial<WorkflowsRuns> = {}

    //searchWorkflowRuns: Partial<WorkflowsRuns> = {
    //    workflow: workflowId,
    //    state: WORKFLOW_RUN_STATE.CHECKING
    //};
//
    //let workflowRunsChecking = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
    //if(workflowRunsChecking.length > 0){
    //    return true;
    //}

    searchWorkflowRuns = {
        workflow: workflowId,
        state: WORKFLOW_RUN_STATE.RUNNING
    };
    let workflowRunsRunning = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
    if(workflowRunsRunning.length > 0){
        return true;
    }

    return false;
}


async function getWorkflowsRunWithPendingOrNoState(myDatabaseHelper: MyDatabaseHelper): Promise<WorkflowsRuns[]> {
    let searchWorkflowRunsPending: Partial<WorkflowsRuns> = {
        state: WORKFLOW_RUN_STATE.PENDING
    };
    let workflowRunsPending = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRunsPending);
    let searchWorkflowRunsNoState: Partial<WorkflowsRuns> = {
        state: null
    };
    let workflowRunsNoState = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRunsNoState);

    return workflowRunsPending.concat(workflowRunsNoState);
}

function getDictWorkflowIdToWorkflowRuns(workflowRuns: WorkflowsRuns[]): { [p: string]: WorkflowsRuns[] } {
    let dictWorkflowIdToWorkflowRuns: { [p: string]: WorkflowsRuns[] } = {};

    for(let workflowRun of workflowRuns){
        let workflowId: string | undefined = undefined
        if(!!workflowRun.workflow){
            if(typeof workflowRun.workflow === "string"){
                workflowId = workflowRun.workflow;
            } else if (typeof workflowRun.workflow === "object"){
                workflowId = workflowRun.workflow.id;
            }
        }
        if(!!workflowId){
            let workflowRunsForWorkflow = dictWorkflowIdToWorkflowRuns[workflowId] || [];
            workflowRunsForWorkflow.push(workflowRun);
            dictWorkflowIdToWorkflowRuns[workflowId] = workflowRunsForWorkflow;
        }
    }

    return dictWorkflowIdToWorkflowRuns;
}

async function processPendingWorkflowRuns(myDatabaseHelper: MyDatabaseHelper){
    // TODO: clean up old workflow_runs which are in state "delete"

    //welche workflow_runs auf pending stehen oder keinen state haben.
    let workflowRunsPendingAndNoState = await getWorkflowsRunWithPendingOrNoState(myDatabaseHelper);
    let dictWorkflowIdToWorkflowRuns = getDictWorkflowIdToWorkflowRuns(workflowRunsPendingAndNoState);

    // und jeweils von einem workflow,
    let workflowIds = Object.keys(dictWorkflowIdToWorkflowRuns);

    for(let workflowId of workflowIds){
        let workflowRuns = dictWorkflowIdToWorkflowRuns[workflowId];
        if(workflowRuns && workflowRuns.length > 0){
            let workflowRunJobInterface = WorkflowScheduler.getRegisteredWorkflow(workflowId);
            if(!workflowRunJobInterface){
                myDatabaseHelper.getWorkflowsRunsHelper().updateMany(workflowRuns, {
                    state: WORKFLOW_RUN_STATE.FAILED,
                    log: "No workflow run job interface found for this workflow."
                })
            } else {
                // sort by date_created, oldest first
                let prioritizedWorkflowRuns = await workflowRunJobInterface.prioritizePendingList(workflowRuns);
                let workflowRunToCheck = prioritizedWorkflowRuns.workflowRunToCheck;

                let workflowRunsToDelele = prioritizedWorkflowRuns.delelePendingJobs;
                if(workflowRunsToDelele.length > 0){
                    try{
                        // we do not need to wait here, as we are in a schedule, and the filter will handle synchronization
                        await myDatabaseHelper.getWorkflowsRunsHelper().deleteManyItems(workflowRunsToDelele);
                    } catch (e){
                        console.error("Error while deleting workflow_runs: "+e);
                    }
                }
                if(!!workflowRunToCheck){
                    // check if another workflow_run is already running
                    try{
                        // we do not need to wait here, as we are in a schedule, and the filter will handle synchronization
                        myDatabaseHelper.getWorkflowsRunsHelper().updateOne(workflowRunToCheck.id, {
                            state: WORKFLOW_RUN_STATE.RUNNING
                        });
                    } catch (e){
                        console.error("Error while setting workflow_run to checking: "+e);
                        // Seems like another workflow_run is already checking or running. We do nothing here as the filter will handle this
                    }
                }

            }
        }
    }

    // set the state of the schedule to finished
    await myDatabaseHelper.getWorkflowsSettingsHelper().setWorkflowsStateWithoutHookTrigger(WorkflowsSettingsStatus.FINISHED);
}

async function deleteWorkflowRunsMarkedToDelete(myDatabaseHelper: MyDatabaseHelper): Promise<void> {
    let searchWorkflowRuns: Partial<WorkflowsRuns> = {
        state: WORKFLOW_RUN_STATE.DELETE
    };
    let workflowRunsToDelete = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
    if(workflowRunsToDelete.length > 0){
        await myDatabaseHelper.getWorkflowsRunsHelper().deleteManyItems(workflowRunsToDelete);
    }
}

export default defineHook(async ({action, init, filter, schedule}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);

    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        // App started, resetting workflow parsing
        await myDatabaseHelper.getWorkflowsSettingsHelper().setWorkflowsStateWithoutHookTrigger(WorkflowsSettingsStatus.FINISHED);
        let workflowsNotFinished: WorkflowsRuns[] = [];

        // Reset all workflow_runs which are in state "running" to "cancelled" because the server was stopped in the middle of the workflow
        let searchWorkflowRuns: Partial<WorkflowsRuns> = {
            state: WORKFLOW_RUN_STATE.RUNNING
        };
        let workflowRunsRunning = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
        workflowsNotFinished = workflowsNotFinished.concat(workflowRunsRunning);

        //let searchWorkflowRunsChecking: Partial<WorkflowsRuns> = {
        //    state: WORKFLOW_RUN_STATE.CHECKING
        //};
        //let workflowRunsChecking = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRunsChecking);
        //workflowsNotFinished = workflowsNotFinished.concat(workflowRunsChecking);

        await myDatabaseHelper.getWorkflowsRunsHelper().updateMany(workflowsNotFinished, {
            state: WORKFLOW_RUN_STATE.FAILED,
            log: "Workflow Run was not finished, as the server was stopped in the middle of the workflow. The workflow was set to failed."
        });
    });

    schedule(CronHelper.EVERY_TEN_SECONDS, async () => {
        myDatabaseHelper.getWorkflowsSettingsHelper().setWorkflowsStateWithHookTrigger(WorkflowsSettingsStatus.RUNNING);
    });

    filter<Partial<WorkflowsSettings>>(CollectionNames.WORKFLOWS_SETTINGS+'.items.update', async (input, {keys, collection}, eventContext) => {
        if(input.workflows_state===WorkflowsSettingsStatus.RUNNING){ // we want to start the schedule
            // check if already schedule is running
            let workflowsSettingsState = await myDatabaseHelper.getWorkflowsSettingsHelper().getWorkflowsState();
            if(workflowsSettingsState===WorkflowsSettingsStatus.FINISHED){ // currently no schedule is running
                // we can start the schedule to process the workflows which are pending
                await deleteWorkflowRunsMarkedToDelete(myDatabaseHelper);
                processPendingWorkflowRuns(myDatabaseHelper);
            } else {
                // we do nothing, because the schedule is already running
            }
        }
        return input; // we do not change the input
    });

    // Filter: WorkflowRun created - setzt log, output, date_finished, date_started auf null und state auf "pending"
    filter<Partial<WorkflowsRuns>>(CollectionNames.WORKFLOWS_RUNS+'.items.create', async (input, {keys, collection}, eventContext) => {
        let output = cleanWorkflowRun(input);
        output.state = WORKFLOW_RUN_STATE.PENDING; // just to make sure it is set to pending no matter what
        return output;
    });


    // Filter: WorkflowRun update when set to "running" - check if another workflow_run is already running
    filter<Partial<WorkflowsRuns>>(CollectionNames.WORKFLOWS_RUNS+'.items.update', async (input, {keys, collection}, eventContext) => {
        if(input.state===WORKFLOW_RUN_STATE.RUNNING){
            input = cleanWorkflowRun(input);
            input.state = WORKFLOW_RUN_STATE.SKIPPED // by default, we skip the workflow_run. We will check if we can set them to checking later

            let item_ids = keys as PrimaryKey[];
            // idealy only one item is updated at a time, but we need to handle the case that multiple items are updated at the same time

            // so lets get the workflow run items first
            let workflowRuns = await myDatabaseHelper.getWorkflowsRunsHelper().readMany(item_ids);

            // we have to check for each workflow their rules. So we have to group the workflow runs by workflow
            let dictWorkflowIdToWorkflowRuns = getDictWorkflowIdToWorkflowRuns(workflowRuns);

            // so when updating multiple workflow runs for one workflow, we will throw an error
            let workflowrunsToSetToRunning: WorkflowsRuns[] = [];

            for(let workflowId of Object.keys(dictWorkflowIdToWorkflowRuns)){
                const workflowRuns = dictWorkflowIdToWorkflowRuns[workflowId];
                if(workflowRuns){
                    // TODO: Check here if for the workflow multiple parallel runs are allowed, otherwise throw an error
                    let parallelRunsAllowed = false;
                    if(parallelRunsAllowed){ // then we don't care and just push all workflow runs
                        workflowrunsToSetToRunning.push(...workflowRuns);
                    } else {
                        // well we have to make sure that only one workflow run can run at a time
                        if(workflowRuns.length > 1){ // if there are multiple workflow_runs for this workflow
                            // we have to throw an error
                            throw new Error("Setting multiple workflow_runs to running for this workflow: "+workflowId+" is not allowed. Only one workflow_run can run at a time.");
                            // TODO: We could set them to "pending" here maybe? Need to check if this is a good idea
                        } else if (workflowRuns.length === 1){
                            // when only one workflow run is trying to be set to running, per workflow
                            let workflowRun = workflowRuns[0];
                            if(!!workflowRun){
                                // we need to check if another workflow_run is already running
                                let anotherWorkflowRunIsCheckingOrRunning = await doesAnotherWorkflowRunExistWhichIsCheckingOrRunning(workflowId, myDatabaseHelper);
                                if(anotherWorkflowRunIsCheckingOrRunning){
                                    throw new Error("Workflow_run with id: "+workflowRun.id+" cannot be set to running, because another is already running for workflow: "+workflowId);
                                    // TODO: We could set them to "pending" here maybe? Need to check if this is a good idea
                                } else {
                                    // we can set the workflow_run to running
                                    workflowrunsToSetToRunning.push(workflowRun);
                                }
                            }
                        }
                    }
                }
            }

            // so at this point, all workflow_runs should be allowed to be set to running
            if(workflowrunsToSetToRunning.length===item_ids.length){
                input.state = WORKFLOW_RUN_STATE.RUNNING; // we can set the workflow_run to running
                input.date_started = new Date().toISOString();
                input.log = "Workflow Run was started.";
            }
        }

        return input;
    });

    action(CollectionNames.WORKFLOWS_RUNS+'.items.update', async ({payload, keys}, eventContext) => {
        if(payload.state===WORKFLOW_RUN_STATE.RUNNING){
            let item_ids = keys as string[];
            // all these workflow runs are allowed to be set to running, so we can start the running
            // TODO: Move to helper method for each workflow_run implementation like food-sync-hook
        }
    });

});