import {HookExtensionContext} from "@directus/types";
import {ApiExtensionContext, RegisterFunctions} from "@directus/extensions";
import {MyDatabaseHelper} from "../../../helpers/MyDatabaseHelper";
import {WorkflowScheduleHelper} from "../../../workflows-runs-hook";
import {FormHousingContractsWorkflowHannover} from "./FormHousingContractsWorkflowHannover";

export class FormSyncHannover {

    public static registerHooks(triggerContext: RegisterFunctions, apiContext: ApiExtensionContext): void {

        const myDatabaseHelper = new MyDatabaseHelper(apiContext);

        // Schedule to create new form_submissions based on the provided CSV file
        WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
            workflowRunInterface: new FormHousingContractsWorkflowHannover(),
            myDatabaseHelper: myDatabaseHelper,
            schedule: triggerContext.schedule,
            cronOject: WorkflowScheduleHelper.EVERY_5_MINUTES,
        });
    }

}