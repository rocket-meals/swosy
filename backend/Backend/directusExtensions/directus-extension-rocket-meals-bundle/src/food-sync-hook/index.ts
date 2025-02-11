import {ParseSchedule,} from "./ParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {FoodParserInterface} from "./FoodParserInterface";
import {FoodTL1Parser_RawReportFtpReader} from "./FoodTL1Parser_RawReportFtpReader";
import {FoodTL1Parser_RawReportUrlReader} from "./FoodTL1Parser_RawReportUrlReader";
import {MarkingTL1Parser} from "./MarkingTL1Parser";
import {MarkingParserInterface} from "./MarkingParserInterface";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {AppSettingsHelper, FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FoodParserWithCustomerAdaptions} from "./FoodParserWithCustomerAdaptions";
import {EnvVariableHelper} from "../helpers/EnvVariableHelper";
import {WORKFLOW_RUN_STATE, WorkflowScheduleHelper, WorkflowScheduler} from "../workflows-runs-hook";
import {
    ResultHandleWorkflowRunsWantToRun,
    WorkflowRunJobInterface, WorkflowRunLogger
} from "../workflows-runs-hook/WorkflowRunJobInterface";
import {WorkflowsRuns} from "../databaseTypes/types";

const SCHEDULE_NAME = "food_parse";

const DIRECTUS_TL1_FOOD_PATH = "/directus/tl1/foodPlan.csv"; // This is defined in docker-compose.yaml statically
const DIRECTUS_TL1_MARKING_PATH = "/directus/tl1/markings.csv"; // This is defined in docker-compose.yaml statically

function getFoodParser(): FoodParserInterface | null {
    const FOOD_SYNC_MODE = EnvVariableHelper.getFoodSyncMode();

    switch (FOOD_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = EnvVariableHelper.getFoodSyncTL1FileExportCsvFilePath();
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = EnvVariableHelper.getFoodSyncTL1FileExportCsvFileEncoding();

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            const ftpFileReader = new FoodTL1Parser_RawReportFtpReader(DIRECTUS_TL1_FOOD_PATH, FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary

            return FoodParserWithCustomerAdaptions.getFoodParser(ftpFileReader);
        case "TL1WEB":
            /* TL1 URL */
            const FOOD_SYNC_TL1WEB_EXPORT_URL = EnvVariableHelper.getFoodSyncTL1WebExportUrl();
            if(!FOOD_SYNC_TL1WEB_EXPORT_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for TL1WEB");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from URL: " + FOOD_SYNC_TL1WEB_EXPORT_URL);
            const urlReader = new FoodTL1Parser_RawReportUrlReader(FOOD_SYNC_TL1WEB_EXPORT_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return FoodParserWithCustomerAdaptions.getFoodParser(urlReader);
        case "SWOSY_API":
            const FOOD_SYNC_SWOSY_API_URL = EnvVariableHelper.getFoodImageSyncSwosyApiServerUrl();
            if(!!FOOD_SYNC_SWOSY_API_URL && FOOD_SYNC_SWOSY_API_URL.length > 0) {
                //return new FoodParserWithCustomerAdaptions(new SWOSY_API_Parser(FOOD_SYNC_SWOSY_API_URL, 7));
            } else {
                console.log(SCHEDULE_NAME + ": no URL configured for SWOSY_API, please set the environment variable FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL");
            }
    }

    return null;
}

function getMarkingParser(): MarkingParserInterface | null {
    const MARKING_SYNC_MODE = EnvVariableHelper.getMarkingSyncMode();

    switch (MARKING_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = EnvVariableHelper.getMarkingSyncTL1FileExportCsvFilePath();
            const MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = EnvVariableHelper.getMarkingSyncTL1FileExportCsvFileEncoding();

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            return new MarkingTL1Parser(DIRECTUS_TL1_MARKING_PATH, MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
    }

    return null;
}

class FoodParseWorkflow implements WorkflowRunJobInterface {
    getDeleteFailedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getDeleteFinishedWorkflowRunsAfterDays(): number | undefined {
        return undefined;
    }

    getWorkflowId(): string {
        return "food-sync";
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
            let usedFoodParser = getFoodParser();

            if(!usedFoodParser) {
                await logger.appendLog("no food parser configured");
            }

            let usedMarkingParser = getMarkingParser();
            if(!usedMarkingParser) {
                await logger.appendLog("no marking parser configured");
            }

            console.log("Parse schedule now creating");
            const parseSchedule = new ParseSchedule(workflowRun, myDatabaseHelper, logger, usedFoodParser, usedMarkingParser);
            return await parseSchedule.parse();
        } catch (err: any) {
            await logger.appendLog("Error: " + err.toString());
            return logger.getFinalLogWithStateAndParams({
                state: WORKFLOW_RUN_STATE.FAILED,
            })
        }
    }

}

export default defineHook(async ({action, init, filter, schedule}, apiContext) => {
    let myDatabaseHelper = new MyDatabaseHelper(apiContext);

    WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
        workflowRunInterface: new FoodParseWorkflow(),
        myDatabaseHelper: myDatabaseHelper,
        schedule: schedule,
        cronOject: WorkflowScheduleHelper.EVERY_5_MINUTES,
    });
});