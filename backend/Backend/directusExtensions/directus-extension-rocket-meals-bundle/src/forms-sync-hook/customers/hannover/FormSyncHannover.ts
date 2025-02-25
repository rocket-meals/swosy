import {HookExtensionContext} from "@directus/types";
import {ApiExtensionContext, RegisterFunctions} from "@directus/extensions";
import {MyDatabaseHelper} from "../../../helpers/MyDatabaseHelper";
import {WorkflowScheduleHelper} from "../../../workflows-runs-hook";
import {FormHousingContractsWorkflowHannover} from "./FormHousingContractsWorkflowHannover";
import {EnvVariableHelper} from "../../../helpers/EnvVariableHelper";

export class FormSyncHannover {

    public static registerHooks(triggerContext: RegisterFunctions, apiContext: ApiExtensionContext): void {

        const myDatabaseHelper = new MyDatabaseHelper(apiContext);
        let housingPath = EnvVariableHelper.getHousingContractCsvFilePath();
        if(!housingPath){
            console.error("Missing env variable: HOUSING_CONTRACT_CSV_FILE_PATH");
            return;
        }

        // Schedule to create new form_submissions based on the provided CSV file
        WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
            workflowRunInterface: new FormHousingContractsWorkflowHannover(housingPath),
            myDatabaseHelper: myDatabaseHelper,
            schedule: triggerContext.schedule,
            cronOject: WorkflowScheduleHelper.EVERY_5_MINUTES,
        });
    }

}