import {WashingmachineParseSchedule} from "./WashingmachineParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {DemoWashingmachineParser} from "./testParser/DemoWashingmachineParser";
import {WashingmachineParserInterface} from "./WashingmachineParserInterface";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {StudentenwerkOsnabrueckWashingmachineParser} from "./osnabrueck/StudentenwerkOsnabrueckWashingmachineParser";

export const SCHEDULE_NAME_WASHING_MACHINE = "washingmachine_parse";
export default defineHook(async ({action}, apiContext) => {
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
