import {ParseSchedule} from "./ParseSchedule"
import {defineHook} from "@directus/extensions-sdk";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper} from "../workflows-runs-hook";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface,
    WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";

class UtilizationCanteenCalculationWorkflow implements WorkflowRunJobInterface {

    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "utilization-canteen-calculation";
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
        await logger.appendLog("Starting utilization canteen calculation");

        try{
            const parseSchedule = new ParseSchedule(workflowRun, myDatabaseHelper, logger);
            return await parseSchedule.parse();
        } catch (err: any) {
            await logger.appendLog("Error: " + err.toString());
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.FAILED,
            })
        }

    }
}

export default defineHook(async ({init, action, schedule}, apiContext) => {
    let myDatabaseHelper = new MyDatabaseHelper(apiContext);

    WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
        workflowRunInterface: new UtilizationCanteenCalculationWorkflow(),
        myDatabaseHelper: myDatabaseHelper,
        schedule: schedule,
        cronOject: WorkflowScheduleHelper.EVERY_15_MINUTES,
    });
});
