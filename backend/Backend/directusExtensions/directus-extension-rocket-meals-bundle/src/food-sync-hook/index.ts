import {ParseSchedule} from "./ParseSchedule"; 
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {ParserInterface} from "./ParserInterface";
import {TL1Parser} from "./TL1Parser";
import {TL1Parser_RawReportFtpReader} from "./TL1Parser_RawReportFtpReader";
import {TL1Parser_RawReportUrlReader} from "./TL1Parser_RawReportUrlReader";
import {SWOSY_API_Parser} from "./SWOSY_API_Parser";

const SCHEDULE_NAME = "food_parse";

function getParser(env: any): ParserInterface | null {
    const FOOD_SYNC_MODE = env.FOOD_SYNC_MODE; // Options: "TL1CSV", "TL1WEB", "SWOSY"

    switch (FOOD_SYNC_MODE) {
        case "TL1CSV":
            /* TL1 CSV FILE */
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH;
            const FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING = env.FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING || "latin1";

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from host file path: " + FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_PATH);
            const tl1_csv_file_path = "/directus/tl1/foodPlan.csv";
            const ftpFileReader = new TL1Parser_RawReportFtpReader(tl1_csv_file_path, FOOD_SYNC_TL1FILE_EXPORT_CSV_FILE_ENCODING);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new TL1Parser(ftpFileReader);
        case "TL1WEB":
            /* TL1 URL */
            const FOOD_SYNC_TL1WEB_EXPORT_URL = env.FOOD_SYNC_TL1WEB_EXPORT_URL;
            if(!FOOD_SYNC_TL1WEB_EXPORT_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for TL1WEB");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using TL1 CSV file from URL: " + FOOD_SYNC_TL1WEB_EXPORT_URL);
            const urlReader = new TL1Parser_RawReportUrlReader(FOOD_SYNC_TL1WEB_EXPORT_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new TL1Parser(urlReader);
        case "SWOSY":
            /* SWOSY API */
            const FOOD_SYNC_SWOSY_API_SERVER_URL = env.FOOD_SYNC_SWOSY_API_SERVER_URL;
            if(!FOOD_SYNC_SWOSY_API_SERVER_URL) {
                console.log(SCHEDULE_NAME + ": no URL configured for SWOSY API");
                return null;
            }

            console.log(SCHEDULE_NAME + ": Using SWOSY API: " + FOOD_SYNC_SWOSY_API_SERVER_URL);
            // @ts-ignore // this should be fine, because the class implements the interface // TODO: Investigate why this is necessary
            return new SWOSY_API_Parser(FOOD_SYNC_SWOSY_API_SERVER_URL);
    }

    return null;
}

export default defineHook(async ({action}, {
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

    const usedParser = getParser(env);

    if(!usedParser) {
        console.log(SCHEDULE_NAME + ": no food parser configured");
        console.log(SCHEDULE_NAME + ": please configure a food parser in the .env file and restart the server");
        return;
    }

    const parseSchedule = new ParseSchedule(usedParser);

    let collection = CollectionNames.APP_SETTINGS

    await parseSchedule.init(getSchema, services, database, logger);

    action(
        collection + ".items.update",
        async () => {
            //TODO check if field "parse_foods" is active
            try {
                await parseSchedule.parse(false);
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});