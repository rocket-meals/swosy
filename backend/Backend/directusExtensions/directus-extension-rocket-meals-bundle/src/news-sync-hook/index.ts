import {NewsParseSchedule} from "./NewsParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {TestNews_Parser} from "./TestNews_Parser";

let usedParser = new TestNews_Parser()

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

export default defineHook(async ({action}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    const {
        services,
        database,
        getSchema,
        env,
        logger
    } = apiContext;

    const parseSchedule = new NewsParseSchedule(apiContext, usedParser);

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
