import {WashingmachineParseSchedule} from "./WashingmachineParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {DemoWashingmachineParser} from "./testParser/DemoWashingmachineParser";
import {WashingmachineParserInterface} from "./WashingmachineParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {StudentenwerkOsnabrueckWashingmachineParser} from "./osnabrueck/StudentenwerkOsnabrueckWashingmachineParser";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";

export const SCHEDULE_NAME_WASHING_MACHINE = "washingmachine_parse";
export default defineHook(async ({action, init}, apiContext) => {
    const SCHEDULE_NAME = SCHEDULE_NAME_WASHING_MACHINE;
    const collection = CollectionNames.APP_SETTINGS;

    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let usedParser: WashingmachineParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = new DemoWashingmachineParser()
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = null
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new StudentenwerkOsnabrueckWashingmachineParser()
            break;
    }

    if(!usedParser){
        console.log("No Parser set for Washingmachine Sync");
        return;
    }

    const parseSchedule = new WashingmachineParseSchedule(apiContext, usedParser);

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);
    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting "+SCHEDULE_NAME+" parsing status and parsing hash");
        await myDatabaseHelper.getAppSettingsHelper().setWashingmachineParsingStatus(FlowStatus.FINISHED, null);
    });

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
