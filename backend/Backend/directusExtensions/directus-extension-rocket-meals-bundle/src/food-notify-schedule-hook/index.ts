import { defineHook } from '@directus/extensions-sdk';
import {NotifySchedule} from "./NotifySchedule";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper, WorkflowScheduler} from "../workflows-runs-hook";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {
	ResultHandleWorkflowRunsWantToRun,
	WorkflowRunJobInterface, WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";
import {ParseSchedule} from "../food-sync-hook/ParseSchedule";

class FoodNotifyWorkflow implements WorkflowRunJobInterface {
	getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
		return undefined;
	}

	getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
		return undefined;
	}

	getWorkflowId(): string {
		return "food-notify";
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
		await logger.appendLog("Starting food parsing");

		try {
			const notifySchedule = new NotifySchedule(workflowRun, myDatabaseHelper, logger);
			let aboutMealsInDays = 1;
			return await notifySchedule.notify(aboutMealsInDays);
		} catch (err: any) {
			await logger.appendLog("Error: " + err.toString());
			return logger.getFinalLogWithStateAndParams({
				state: WORKFLOW_RUN_STATE.FAILED,
			})
		}
	}

}


export default defineHook(async ({action, schedule}, apiContext) => {
	let myDatabaseHelper = new MyDatabaseHelper(apiContext);

	WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
		workflowRunInterface: new FoodNotifyWorkflow(),
		myDatabaseHelper: myDatabaseHelper,
		schedule: schedule,
		cronOject: WorkflowScheduleHelper.EVERY_DAY_AT_17_59,
	});
});
