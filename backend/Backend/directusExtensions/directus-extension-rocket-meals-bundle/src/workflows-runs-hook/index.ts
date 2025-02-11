import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {Workflows, WorkflowsRuns} from "../databaseTypes/types";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {PrimaryKey, ScheduleHandler} from "@directus/types";
import {WorkflowRunJobInterface, WorkflowRunLogger} from "./WorkflowRunJobInterface";

const SCHEDULE_NAME = "workflows_hook";

export type CronObject = {
    seconds: string | number,
    minutes: string | number,
    hours: string | number,
    dayOfMonth: string | number,
    month: string | number,
    dayOfWeek: string | number,
}

export type ScheduleFromExtension = (cron: string, handler: ScheduleHandler) => void;

export class WorkflowScheduleHelper {
    static getCronString(cronObject: CronObject): string {
        return cronObject.seconds + " " + cronObject.minutes + " " + cronObject.hours + " " + cronObject.dayOfMonth + " " + cronObject.month + " " + cronObject.dayOfWeek;
    }

    static EVERY_MINUTE: CronObject = {
        seconds: 0,
        minutes: "*",
        hours: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    }

    static EVERY_5_MINUTES: CronObject = {
        seconds: 0,
        minutes: "*/5",
        hours: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    }

    static EVERY_15_MINUTES: CronObject = {
        seconds: 0,
        minutes: "*/15",
        hours: "*",
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    }

    static EVERY_DAY_AT_17_59: CronObject = {
        seconds: 0,
        minutes: 59,
        hours: 17,
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    }

    static EVERY_DAY_AT_4AM: CronObject = {
        seconds: 0,
        minutes: 0,
        hours: 4,
        dayOfMonth: "*",
        month: "*",
        dayOfWeek: "*"
    }

    static async createWorkflowRunInstance(workflowId: string, myDatabaseHelper: MyDatabaseHelper): Promise<void> {
        await myDatabaseHelper.getWorkflowsRunsHelper().createOne({
            workflow: workflowId,
            state: WORKFLOW_RUN_STATE.RUNNING,
        });
    }

    static async registerScheduleToRunWorkflowRuns(config: {
        workflowRunInterface: WorkflowRunJobInterface,
        cronOject: CronObject,
        myDatabaseHelper: MyDatabaseHelper,
        schedule: ScheduleFromExtension
                                                      }): Promise<void> {
        WorkflowScheduler.registerWorkflow(config.workflowRunInterface)
        await WorkflowScheduleHelper.registerScheduleToCreateWorkflowRuns({
            workflowId: config.workflowRunInterface.getWorkflowId(),
            cronOject: config.cronOject,
            myDatabaseHelper: config.myDatabaseHelper,
            schedule: config.schedule
        });
    }

    static async registerScheduleToCreateWorkflowRuns(config: {
        workflowId: string,
        cronOject: CronObject,
        myDatabaseHelper: MyDatabaseHelper,
        schedule: ScheduleFromExtension
    }): Promise<void> {
        let cronString = WorkflowScheduleHelper.getCronString(config.cronOject);
        config.schedule(cronString, async () => {
            try{
                await WorkflowScheduleHelper.createWorkflowRunInstance(config.workflowId, config.myDatabaseHelper);
            } catch (e) {
                console.error("Error while creating workflow run for workflowId: "+config.workflowId+" for workflow schedule: "+cronString);
                console.error(e);
            }
        });
    }

}

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

    static getRegisteredWorkflowsIds(): string[] {
        return Object.keys(WorkflowScheduler.registeredWorkflows);
    }
}

export enum WORKFLOW_RUN_STATE {
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

async function getAlreadyRunningWorkflowruns(workflowId: string, myDatabaseHelper: MyDatabaseHelper): Promise<WorkflowsRuns[]> {
    let searchWorkflowRuns: Partial<WorkflowsRuns> = {}
    searchWorkflowRuns = {
        workflow: workflowId,
        state: WORKFLOW_RUN_STATE.RUNNING
    };
    let alreadyRunningWorkflowruns = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
    return alreadyRunningWorkflowruns
}

function getDictWorkflowIdToWorkflowRuns(workflowRuns: Partial<WorkflowsRuns>[]): { [p: string]: Partial<WorkflowsRuns>[] } {
    let dictWorkflowIdToWorkflowRuns: { [p: string]: Partial<WorkflowsRuns>[] } = {};

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


async function modifyInputForCreateOrUpdateWorkflowRunToRunning(input: Partial<WorkflowsRuns>, dictWorkflowIdToWorkflowRuns: {[p: string]: Partial<WorkflowsRuns>[]}, myDatabaseHelper: MyDatabaseHelper): Promise<Partial<WorkflowsRuns>> {
    if(input.state===WORKFLOW_RUN_STATE.RUNNING){
        input = cleanWorkflowRun(input);

        let workflowIds = Object.keys(dictWorkflowIdToWorkflowRuns);
        let notRegisteredWorkflowIds = workflowIds.filter(workflowId => !WorkflowScheduler.getRegisteredWorkflow(workflowId));
        if(notRegisteredWorkflowIds.length>0){
            throw new Error("-- No WorkflowRunJobInterface found for workflowIds: "+notRegisteredWorkflowIds.join(", "));
        }

        for(let workflowId of Object.keys(dictWorkflowIdToWorkflowRuns)){
            const workflowRuns = dictWorkflowIdToWorkflowRuns[workflowId];
            if(workflowRuns){
                let alreadyRunningWorkflowRuns = await getAlreadyRunningWorkflowruns(workflowId, myDatabaseHelper);
                let workflowRunJobInterface = WorkflowScheduler.getRegisteredWorkflow(workflowId);
                if(!workflowRunJobInterface){
                    // never the case, because we checked before, but just to be sure
                    throw new Error("-- No WorkflowRunJobInterface found for workflowId: "+workflowId);
                } else {
                    let result = await workflowRunJobInterface.handleWorkflowRunsWantToRun(input, workflowRuns, alreadyRunningWorkflowRuns);
                    if(result.errorMessage){
                        throw new Error("Error while setting workflow_runs to running: "+result.errorMessage);
                    }
                }
            }
        }
        input.date_started = new Date().toISOString();
        input.log = input.log || WorkflowRunLogger.createLogRow("Workflow Run started");
    }

    return input;
}

async function handleActionWorkflowRunUpdatedOrCreated(payload: Partial<WorkflowsRuns>, myDatabaseHelper: MyDatabaseHelper, keys: PrimaryKey[], apiContext: any, eventContext: any): Promise<void> {
    await handleActionRunningCreatedOrUpdatedWorkflow(payload, myDatabaseHelper, keys, apiContext, eventContext);
    await handleActionOnUpdateOrCreateIfWorkflowRunShouldBeDeleted(payload, myDatabaseHelper, keys, apiContext, eventContext);
}

async function handleActionRunningCreatedOrUpdatedWorkflow(payload: Partial<WorkflowsRuns>, myDatabaseHelper: MyDatabaseHelper, keys: PrimaryKey[], apiContext: any, eventContext: any): Promise<void> {
    myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    if(payload.state===WORKFLOW_RUN_STATE.RUNNING){
        //console.log("Action: WorkflowRun update to running");
        let item_ids = keys as PrimaryKey[];
        //console.log("item_ids: "+item_ids);
        let existingWorkflowRuns = await myDatabaseHelper.getWorkflowsRunsHelper().readMany(item_ids);
        let dictWorkflowIdToWorkflowRuns = getDictWorkflowIdToWorkflowRuns(existingWorkflowRuns) as {[p: string]: WorkflowsRuns[]};
        //console.log("dictWorkflowIdToWorkflowRuns: ");
        //console.log(JSON.stringify(dictWorkflowIdToWorkflowRuns, null, 2));
        for(let workflowId of Object.keys(dictWorkflowIdToWorkflowRuns)){
            const workflowRuns = dictWorkflowIdToWorkflowRuns[workflowId];
            if(workflowRuns){
                let workflowRunJobInterface = WorkflowScheduler.getRegisteredWorkflow(workflowId);
                if(!workflowRunJobInterface){
                    throw new Error("No WorkflowRunJobInterface found for workflowId: "+workflowId);
                } else {
                    for(let workflowRun of workflowRuns){
                        //console.log("-- Running workflowRun: "+workflowRun.id);
                        let result = await workflowRunJobInterface.runJob(workflowRun, myDatabaseHelper, new WorkflowRunLogger(workflowRun, myDatabaseHelper));
                        let legalStates = [WORKFLOW_RUN_STATE.SUCCESS, WORKFLOW_RUN_STATE.FAILED, WORKFLOW_RUN_STATE.SKIPPED, WORKFLOW_RUN_STATE.DELETE] as string[];
                        let hasResultLegalState = false;
                        if(!!result.state && legalStates.includes(result.state)){
                            hasResultLegalState = true;
                        }
                        if(!hasResultLegalState){
                            result.state = WORKFLOW_RUN_STATE.SUCCESS;
                        }

                        result.date_finished = new Date().toISOString();
                        result.log = result.log || "Workflow Run finished";

                        await myDatabaseHelper.getWorkflowsRunsHelper().updateOneWithoutHookTrigger(workflowRun.id, result);

                    }
                }
            }
        }
    }
}

async function handleActionOnUpdateOrCreateIfWorkflowRunShouldBeDeleted(payload: Partial<WorkflowsRuns>, myDatabaseHelper: MyDatabaseHelper, keys: PrimaryKey[], apiContext: any, eventContext: any): Promise<void> {
    if(payload.state===WORKFLOW_RUN_STATE.DELETE){
        let item_ids = keys as PrimaryKey[];
        let existingWorkflowRuns = await myDatabaseHelper.getWorkflowsRunsHelper().readMany(item_ids);
        for(let workflowRun of existingWorkflowRuns){
            await myDatabaseHelper.getWorkflowsRunsHelper().deleteOne(workflowRun.id);
        }
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
        let workflowsNotFinished: WorkflowsRuns[] = [];

        // Reset all workflow_runs which are in state "running" to "cancelled" because the server was stopped in the middle of the workflow
        let searchWorkflowRuns: Partial<WorkflowsRuns> = {
            state: WORKFLOW_RUN_STATE.RUNNING
        };
        let workflowRunsRunning = await myDatabaseHelper.getWorkflowsRunsHelper().findItems(searchWorkflowRuns);
        workflowsNotFinished = workflowsNotFinished.concat(workflowRunsRunning);

        await myDatabaseHelper.getWorkflowsRunsHelper().updateMany(workflowsNotFinished, {
            state: WORKFLOW_RUN_STATE.FAILED,
            log: "Workflow Run was not finished, as the server was stopped in the middle of the workflow. The workflow was set to failed."
        });

        // try creating registered workflows if they are not already created
        let registeredWorkflowsIds = WorkflowScheduler.getRegisteredWorkflowsIds();
        for(let workflowId of registeredWorkflowsIds){
            let searchAndUpdate: Partial<Workflows> = {
                id: workflowId,
                alias: workflowId,
            };
            let workflow = await myDatabaseHelper.getWorkflowsHelper().upsertOne(searchAndUpdate);
        }
    });




    // Filter: WorkflowRun created - setzt log, output, date_finished, date_started auf null und state auf "pending"
    filter<Partial<WorkflowsRuns>>(CollectionNames.WORKFLOWS_RUNS+'.items.create', async (input, {keys, collection}, eventContext) => {
        if(input.state===undefined){ // default state is "running"
            // TODO: Fetch database schema and look what the default value is
            input.state = WORKFLOW_RUN_STATE.RUNNING;
        }

        if(input.state===WORKFLOW_RUN_STATE.RUNNING){
            let dictWorkflowIdToWorkflowRuns = getDictWorkflowIdToWorkflowRuns([input]);
            input = await modifyInputForCreateOrUpdateWorkflowRunToRunning(input, dictWorkflowIdToWorkflowRuns, myDatabaseHelper);
        }
        return input;
    });


    // Filter: WorkflowRun update when set to "running" - check if another workflow_run is already running
    filter<Partial<WorkflowsRuns>>(CollectionNames.WORKFLOWS_RUNS+'.items.update', async (input, {keys, collection}, eventContext) => {
        if(input.state===WORKFLOW_RUN_STATE.RUNNING){
            let item_ids = keys as PrimaryKey[];
            let existingWorkflowRuns = await myDatabaseHelper.getWorkflowsRunsHelper().readMany(item_ids);
            let dictWorkflowIdToWorkflowRuns = getDictWorkflowIdToWorkflowRuns(existingWorkflowRuns);

            let inputWorkflowId: string | undefined = undefined;
            if(input.workflow){
                if(typeof input.workflow === "string"){
                    inputWorkflowId = input.workflow;
                } else if (typeof input.workflow === "object"){
                    inputWorkflowId = input.workflow.id;
                }
            }
            if(inputWorkflowId){ // the update want to set the workflow_run to anonther workflow
                dictWorkflowIdToWorkflowRuns[inputWorkflowId] = existingWorkflowRuns;
            }

            let amountDifferentWorkflows = Object.keys(dictWorkflowIdToWorkflowRuns).length;
            if(amountDifferentWorkflows>1){
                throw new Error("You can only update workflow_runs with the same workflow_id at once.");
            }
            input = await modifyInputForCreateOrUpdateWorkflowRunToRunning(input, dictWorkflowIdToWorkflowRuns, myDatabaseHelper);
        }

        return input;
    });

    action(CollectionNames.WORKFLOWS_RUNS+'.items.create', async (meta, eventContext) => {
        let {payload, key} = meta;
        let keys = [key];
        await handleActionWorkflowRunUpdatedOrCreated(payload, myDatabaseHelper, keys, apiContext, eventContext);
    });

    action(CollectionNames.WORKFLOWS_RUNS+'.items.update', async ({payload, keys}, eventContext) => {
        await handleActionWorkflowRunUpdatedOrCreated(payload, myDatabaseHelper, keys, apiContext, eventContext);
    });

});