import {ParseSchedule} from "./ParseSchedule"
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";

const SCHEDULE_NAME = "utilization_canteen";
export default defineHook(async ({init, action}, apiContext) => {
    let collection = CollectionNames.APP_SETTINGS

    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);
    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting "+SCHEDULE_NAME);
        await myDatabaseHelper.getAppSettingsHelper().setUtilizationForecastCalculationStatus(FlowStatus.FINISHED, null);
    });

    action(
        collection + ".items.update",
        async (event, eventContext) => {
            //TODO check if field "parse_foods" is active
            try {
                const parseSchedule = new ParseSchedule(apiContext, eventContext);
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});
