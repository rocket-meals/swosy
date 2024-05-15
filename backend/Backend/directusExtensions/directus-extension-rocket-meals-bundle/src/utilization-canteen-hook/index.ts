import {ParseSchedule} from "./ParseSchedule"
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const parseSchedule = new ParseSchedule();

const SCHEDULE_NAME = "utilization_canteen";
export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    let collection = CollectionNames.APP_SETTINGS

    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema);
    if (!allTablesExist) {
        return;
    }

    try {
        console.log("foodParseSchedule init");
        await parseSchedule.init(getSchema, services, database, logger);
        console.log("foodParseSchedule master init finished");
    } catch (err) {
        let errMsg = err.toString();
        if (errMsg.includes("no such table: directus_collections")) {
            console.log("+++++++++ Meal Parse Schedule +++++++++");
            console.log("++++ Database not initialized yet +++++");
            console.log("+++ Restart Server again after init +++");
            console.log("+++++++++++++++++++++++++++++++++++++++");
        } else {
            console.log("Meal Parse Schedule init error: ");
            console.log(err);
        }
    }

    action(
        collection + ".items.update",
        async () => {
            //TODO check if field "parse_foods" is active
            try {
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});
