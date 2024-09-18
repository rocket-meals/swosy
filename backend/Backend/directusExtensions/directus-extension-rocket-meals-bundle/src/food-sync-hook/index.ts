import {ParseSchedule,} from "./ParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {FoodParserInterface} from "./FoodParserInterface";
import {FoodTL1Parser} from "./FoodTL1Parser";
import {FoodTL1Parser_RawReportFtpReader} from "./FoodTL1Parser_RawReportFtpReader";
import {FoodTL1Parser_RawReportUrlReader} from "./FoodTL1Parser_RawReportUrlReader";
import {MarkingTL1Parser} from "./MarkingTL1Parser";
import {MarkingParserInterface} from "./MarkingParserInterface";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {AppSettingsHelper, FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {SWOSY_API_Parser} from "./SWOSY_API_Parser";
import {FoodParserWithCustomerAdaptions} from "./FoodParserWithCustomerAdaptions";
import {EnvVariableHelper} from "../helpers/EnvVariableHelper";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";

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
            return new FoodParserWithCustomerAdaptions(new FoodTL1Parser(ftpFileReader));
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
            return new FoodParserWithCustomerAdaptions(new FoodTL1Parser(urlReader));
        case "SWOSY_API":
            const FOOD_SYNC_SWOSY_API_URL = EnvVariableHelper.getFoodImageSyncSwosyApiServerUrl();
            if(!!FOOD_SYNC_SWOSY_API_URL && FOOD_SYNC_SWOSY_API_URL.length > 0) {
                return new FoodParserWithCustomerAdaptions(new SWOSY_API_Parser(FOOD_SYNC_SWOSY_API_URL, 7));
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
        case "SWOSY_API":
            const FOOD_SYNC_SWOSY_API_URL = EnvVariableHelper.getFoodImageSyncSwosyApiServerUrl();
            if(!!FOOD_SYNC_SWOSY_API_URL && FOOD_SYNC_SWOSY_API_URL.length > 0) {
                return new SWOSY_API_Parser(FOOD_SYNC_SWOSY_API_URL, 7);
            } else {
                console.log(SCHEDULE_NAME + ": no URL configured for SWOSY_API, please set the environment variable FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL");
            }
    }

    return null;
}

export default defineHook(async ({action, init, filter}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let collection = CollectionNames.APP_SETTINGS

    const myDatabaseHelper = new MyDatabaseHelper(apiContext);

    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting food parsing status and parsing hash");
        await myDatabaseHelper.getAppSettingsHelper().setFoodParsingStatus(FlowStatus.FINISHED, null);
    });

    // filter all update actions where from value running to start want to change, since this is not allowed
    filter(collection+'.items.update', async (input: any, {keys, collection}, eventContext) => {
        // Fetch the current item from the database
        if (!keys || keys.length === 0) {
            throw new Error("No keys provided for update");
        }
        // check if input has field FIELD_APP_SETTINGS_FOODS_PARSING_STATUS and if it is set to start
        if (input[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS] === FlowStatus.START) {
            const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
            const parsingStatus = await myDatabaseHelper.getAppSettingsHelper().getFoodParsingStatus();
            if (parsingStatus === FlowStatus.RUNNING) {
                throw new Error("Parsing is already running. Please wait until it is finished or set to "+FlowStatus.FINISHED+" manually.");
            }
        }

        return input;
    });

    action(
        collection + ".items.update",
        async (event, eventContext) => {
            try {
                let usedFoodParser = getFoodParser();

                if(!usedFoodParser) {
                    console.log(SCHEDULE_NAME + ": no food parser configured");
                }

                let usedMarkingParser = getMarkingParser();
                if(!usedMarkingParser) {
                    console.log(SCHEDULE_NAME + ": no marking parser configured");
                }

                const parseSchedule = new ParseSchedule(apiContext, eventContext, usedFoodParser, usedMarkingParser);
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
        }
    );
});