import {ApartmentsParseSchedule} from "./ApartmentsParseSchedule"; // in directus we need to add the filetype ... otherwise we get an error
import {StudentenwerkHannoverApartments_Parser} from "./StudentenwerkHannoverApartments_Parser";
import {defineHook} from "@directus/extensions-sdk"; // in directus we need to add the filetype ... otherwise we get an error


const parseSchedule = new ApartmentsParseSchedule(StudentenwerkHannoverApartments_Parser);


export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    logger.info("housing-sync-hook: init");

    try {
        await parseSchedule.init(getSchema, services, database, logger);
    } catch (err) {
        let errMsg = err.toString();
        if (errMsg.includes("no such table: directus_collections")) {
            console.log("+++++++++ Meal Parse Schedule +++++++++");
            console.log("++++ Database not initialized yet +++++");
            console.log("+++ Restart Server again after init +++");
            console.log("+++++++++++++++++++++++++++++++++++++++");
        } else {
            console.log("News Parse Schedule init error: ");
            console.log(err);
        }
    }

    let collection = "app_settings";

    /**
    console.log("DEBUG SCHEDULE")
    let manualParser = new StudentenwerkHannoverApartments_Parser();
    let items = await manualParser.getJSONList();
    console.log("items")
    console.log(JSON.stringify(items, null, 2))
        */

    action(
        collection + ".items.update",
        async () => {
            console.log("housing-sync-hook: update")
            try {
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});
