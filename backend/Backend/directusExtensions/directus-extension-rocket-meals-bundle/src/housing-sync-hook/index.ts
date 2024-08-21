import {ApartmentsParseSchedule} from "./ApartmentsParseSchedule";
import {StudentenwerkHannoverApartments_Parser} from "./hannover/StudentenwerkHannoverApartments_Parser";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {ApartmentParserInterface} from "./ApartmentParserInterface";
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";

const SCHEDULE_NAME = "housing_parse";
export default defineHook(async ({action, init}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let usedParser: ApartmentParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = null;
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = new StudentenwerkHannoverApartments_Parser()
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = null
            break;
    }

    if(usedParser === null){
        console.log("No ApartmentParserInterface found for SyncForCustomerEnum: "+EnvVariableHelper.getSyncForCustomer())
        return;
    }

    const parseSchedule = new ApartmentsParseSchedule(apiContext, usedParser);

    let myDatabaseHelper = new MyDatabaseHelper(apiContext);
    init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
        console.log(SCHEDULE_NAME + ": App started, resetting food parsing status and parsing hash");
        await myDatabaseHelper.getAppSettingsHelper().setApartmentParsingStatus(FlowStatus.FINISHED, null);
    });

    let collection = CollectionNames.APP_SETTINGS

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
            console.log(SCHEDULE_NAME+" hook: update")
            try {
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});
