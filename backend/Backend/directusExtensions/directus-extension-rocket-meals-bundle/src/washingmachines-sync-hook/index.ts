import {WashingmachineParseSchedule} from "./WashingmachineParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {DemoWashingmachineParser} from "./testParser/DemoWashingmachineParser";
import {WashingmachineParserInterface} from "./WashingmachineParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {StudentenwerkOsnabrueckWashingmachineParser} from "./osnabrueck/StudentenwerkOsnabrueckWashingmachineParser";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {Washingmachines, WorkflowsRuns} from "../databaseTypes/types";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper, WorkflowScheduler} from "../workflows-runs-hook";
import {FilterHandler} from "@directus/types";
import {RegisterFunctions} from "@directus/extensions";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface, WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {CashregisterTransactionParserInterface} from "../cashregister-hook/CashregisterTransactionParserInterface";
import {ParseSchedule} from "../cashregister-hook/ParseSchedule";
import {log} from "node:util";



function registerWashingmachinesFilterUpdate(apiContext: any, registerFunctions: RegisterFunctions) {
    const {filter} = registerFunctions;
    // Washingmachines Jobs Creation
    filter<Washingmachines>(CollectionNames.WASHINGMACHINES+'.items.update', async (input: Washingmachines, {keys, collection}, eventContext) => {
        // Fetch the current item from the database
        if (!keys || keys.length === 0) {
            throw new Error("No keys provided for update");
        }
        let washingmachines_ids = keys;
        let washingmachine_new: Partial<Washingmachines> = input;
        let new_date_finished = washingmachine_new.date_finished;

        const hasWashingmachineNewPropertyDateFinished = Object.prototype.hasOwnProperty.call(washingmachine_new, 'date_finished');

        if(hasWashingmachineNewPropertyDateFinished && new_date_finished===null){
            let myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
            if(!!washingmachines_ids) {
                for (let washingmachine_id of washingmachines_ids) {
                    let washingmachine_curent = await myDatabaseHelper.getWashingmachinesHelper().readOne(washingmachine_id);

                    let current_date_stated = washingmachine_curent.date_stated;
                    let current_date_finished = washingmachine_curent.date_finished;

                    if (!!current_date_stated && !!current_date_finished) { // currently washing
                        // then save it as a finished washing job
                        let time_diff = new Date(current_date_finished).getTime() - new Date(current_date_stated).getTime();
                        if (time_diff > 0) {
                            let time_hours = parseInt(time_diff / 1000 / 60 / 60 + "");
                            let time_minutes = parseInt(time_diff / 1000 / 60 % 60 + "");
                            let time_seconds = parseInt(time_diff / 1000 % 60 + "");
                            let hh_mm_ss = time_hours + ":" + time_minutes + ":" + time_seconds;

                            const duration_in_minutes = parseInt((time_diff / 1000 / 60)+""); // Total duration in minutes

                            // Round duration to the nearest 10-minute interval
                            const duration_rounded_10min_calculated = Math.ceil(duration_in_minutes / 10) * 10;

                            await myDatabaseHelper.getWashingmachinesJobsHelper().createOne({
                                date_start: current_date_stated,
                                date_end: current_date_finished,
                                duration_calculated: hh_mm_ss,
                                duration_in_minutes_calculated: duration_in_minutes,
                                duration_in_minutes_rounded_10min_calculated: duration_rounded_10min_calculated,
                                washingmachine: washingmachine_curent.id,
                                apartment: washingmachine_curent.apartment
                            });
                        }

                    }
                }
            }
        }

        return input;
    });
}



class WashingmachinesWorkflow implements WorkflowRunJobInterface {

    private usedParser: WashingmachineParserInterface;

    constructor(usedParser: WashingmachineParserInterface) {
        this.usedParser = usedParser;
    }

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "washingmachines-parse";
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
        await logger.appendLog("Starting washingmachine parsing");

        const parseSchedule = new WashingmachineParseSchedule(workflowRun, myDatabaseHelper, logger, this.usedParser);
        try{
            return await parseSchedule.parse();
        } catch (err: any) {
            await logger.appendLog("Error: " + err.toString());
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.FAILED,
            })
        }

    }

}

export default defineHook(async (registerFunctions: RegisterFunctions, apiContext) => {
    const {action, filter, schedule} = registerFunctions;

    registerWashingmachinesFilterUpdate(apiContext, registerFunctions);

    let usedParser: WashingmachineParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = new DemoWashingmachineParser()
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = null
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new StudentenwerkOsnabrueckWashingmachineParser()
            break;
    }

    if(!usedParser){
        console.log("No Parser set for Washingmachine Sync");
        return;
    }

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);

    WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
        workflowRunInterface: new WashingmachinesWorkflow(usedParser),
        myDatabaseHelper: myDatabaseHelper,
        schedule: schedule,
        cronOject: WorkflowScheduleHelper.EVERY_DAY_AT_17_59,
    });

});
