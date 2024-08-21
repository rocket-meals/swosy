import {NewsParseSchedule} from "./NewsParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {DemoNews_Parser} from "./DemoNews_Parser";
import {NewsParserInterface} from "./NewsParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {StudentenwerkHannoverNews_Parser} from "./StudentenwerkHannoverNews_Parser";
import {StudentenwerkOsnabrueckNews_Parser} from "./StudentenwerkOsnabrueckNews_Parser";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";

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

export default defineHook(async ({action, init}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let usedParser: NewsParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = new DemoNews_Parser();
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = new StudentenwerkHannoverNews_Parser()
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new StudentenwerkOsnabrueckNews_Parser()
            break;
    }

    if(!usedParser){
        console.log("No Parser set for News Sync");
        return;
    }

    const parseSchedule = new NewsParseSchedule(apiContext, usedParser);

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);
    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting "+SCHEDULE_NAME+" parsing status and parsing hash");
        await myDatabaseHelper.getAppSettingsHelper().setNewsParsingStatus(FlowStatus.FINISHED);
    });

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
