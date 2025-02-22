import {HookExtensionContext} from "@directus/types";
import {ApiExtensionContext, RegisterFunctions} from "@directus/extensions";
import {MyDatabaseHelper} from "../../../helpers/MyDatabaseHelper";
import {WorkflowScheduleHelper} from "../../../workflows-runs-hook";
import {FormHouseWorkflowHannover} from "./FormHouseWorkflowHannover";

export class FormSyncHannover {

    public static registerHooks(triggerContext: RegisterFunctions, apiContext: ApiExtensionContext): void {

        const myDatabaseHelper = new MyDatabaseHelper(apiContext);
        WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
            workflowRunInterface: new FormHouseWorkflowHannover(),
            myDatabaseHelper: myDatabaseHelper,
            schedule: triggerContext.schedule,
            cronOject: WorkflowScheduleHelper.EVERY_5_MINUTES,
        });
    }

}