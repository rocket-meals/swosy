import {ParseSchedule,} from "./ParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {FoodParserInterface} from "./FoodParserInterface";
import {FoodTL1Parser} from "./FoodTL1Parser";
import {FoodTL1Parser_RawReportFtpReader} from "./FoodTL1Parser_RawReportFtpReader";
import {FoodTL1Parser_RawReportUrlReader} from "./FoodTL1Parser_RawReportUrlReader";
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {MarkingTL1Parser} from "./MarkingTL1Parser";
import {MarkingParserInterface} from "./MarkingParserInterface";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {AppSettingsHelper} from "../helpers/AppSettingsHelper";

const SCHEDULE_NAME = "food_parse";

const DIRECTUS_TL1_FOOD_PATH = "/directus/tl1/foodPlan.csv"; // This is defined in docker-compose.yaml statically
const DIRECTUS_TL1_MARKING_PATH = "/directus/tl1/markings.csv"; // This is defined in docker-compose.yaml statically

function getFoodParser(env: any): FoodParserInterface | null {
    const FOOD_SYNC_MODE = env.FOOD_SYNC_MODE; // Options: "TL1CSV", "TL1WEB", "SWOSY"

    switch (FOOD_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH;
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING || "latin1";

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            const ftpFileReader = new FoodTL1Parser_RawReportFtpReader(DIRECTUS_TL1_FOOD_PATH, FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new FoodTL1Parser(ftpFileReader);
        case "TL1WEB":
            /* TL1 URL */
            const FOOD_SYNC_TL1WEB_EXPORT_URL = env.FOOD_SYNC_TL1WEB_EXPORT_URL;
            if(!FOOD_SYNC_TL1WEB_EXPORT_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for TL1WEB");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from URL: " + FOOD_SYNC_TL1WEB_EXPORT_URL);
            const urlReader = new FoodTL1Parser_RawReportUrlReader(FOOD_SYNC_TL1WEB_EXPORT_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new FoodTL1Parser(urlReader);
    }

    return null;
}

function getMarkingParser(env: any): MarkingParserInterface | null {
    const MARKING_SYNC_MODE = env.MARKING_SYNC_MODE; // Options: "TL1CSV", "TL1WEB"

    switch (MARKING_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = env.MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH;
            const MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = env.MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING || "utf8";

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            return new MarkingTL1Parser(DIRECTUS_TL1_MARKING_PATH, MARKING_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
    }

    return null;
}

export default defineHook(async ({action, init, filter}, {
    services,
    database,
    env,
    getSchema,
    logger
}) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema);
    if (!allTablesExist) {
        return;
    }

    let usedFoodParser = getFoodParser(env);
    if(!usedFoodParser) {
        console.log(SCHEDULE_NAME + ": no food parser configured");
    }

    let usedMarkingParser = getMarkingParser(env);
    if(!usedMarkingParser) {
        console.log(SCHEDULE_NAME + ": no marking parser configured");
    }

    const parseSchedule = new ParseSchedule(usedFoodParser, usedMarkingParser);

    let collection = CollectionNames.APP_SETTINGS

    await parseSchedule.init(getSchema, services, database, logger, env);

    let schema = await getSchema();
    let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);

    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting food parsing status and parsing hash");
        await AppSettingsHelper.setAppSettings(itemsServiceCreator, {
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS]: AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FINISHED,
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_HASH]: null
        });
    });

    // filter all update actions where from value running to start want to change, since this is not allowed
    filter(collection+'.items.update', async (input, {keys, collection}) => {
        // Fetch the current item from the database
        if (!keys || keys.length === 0) {
            throw new Error("No keys provided for update");
        }
        // check if input has field FIELD_APP_SETTINGS_FOODS_PARSING_STATUS and if it is set to start
        if (input[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS] === AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_START) {
            const appSettings = await AppSettingsHelper.readAppSettings(itemsServiceCreator);
            if (appSettings[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS] === AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_RUNNING) {
                throw new Error("Parsing is already running. Please wait until it is finished or set to "+AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FINISHED+" manually.");
            }
        }

        return input;
    });

    action(
        collection + ".items.update",
        async () => {
            try {
                await parseSchedule.parse(false);
            } catch (err) {
                console.log(err);
            }
        }
    );
});