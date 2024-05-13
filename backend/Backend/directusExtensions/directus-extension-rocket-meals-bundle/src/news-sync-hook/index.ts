import {NewsParseSchedule} from "./NewsParseSchedule"; // in directus we need to add the filetype ... otherwise we get an error
import {StudentenwerkHannoverNews_Parser} from "./StudentenwerkHannoverNews_Parser";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck"; // in directus we need to add the filetype ... otherwise we get an error


const parseSchedule = new NewsParseSchedule(StudentenwerkHannoverNews_Parser);

const SCHEDULE_NAME = "news_parse";
/**
 *    *    *    *    *    *
 ┬    ┬    ┬    ┬    ┬    ┬
 │    │    │    │    │    │
 │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 │    │    │    │    └───── month (1 - 12)
 │    │    │    └────────── day of month (1 - 31)
 │    │    └─────────────── hour (0 - 23)
 │    └──────────────────── minute (0 - 59)
 └───────────────────────── second (0 - 59, OPTIONAL)
 */

export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema, database);
    if (!allTablesExist) {
        return;
    }

       try {
            await parseSchedule.init(getSchema, services, database, logger);
        } catch (err: any) {
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

        let collection = CollectionNames.APP_SETTINGS;

        action(
            collection + ".items.update",
            async () => {
                try {
                    await parseSchedule.parse();
                } catch (err) {
                    console.log(err);
                }
            }
        );
});
