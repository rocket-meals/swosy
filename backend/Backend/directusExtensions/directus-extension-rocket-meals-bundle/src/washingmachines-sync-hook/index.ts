import {WashingmachineParseSchedule} from "./WashingmachineParseSchedule";
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {TestWashingmachineParser} from "./testParser/TestWashingmachineParser";
import {WashingmachineParserInterface} from "./WashingmachineParserInterface";
import {EnvVariableHelper} from "../helpers/EnvVariableHelper";


let parseInterface: WashingmachineParserInterface | undefined = undefined;
if(EnvVariableHelper.isDevelopmentServerOrLocal()){
    console.log("Development Server: Using TestWashingmachineParser");
    parseInterface = new TestWashingmachineParser();
}

const parseSchedule = new WashingmachineParseSchedule(parseInterface);

export const SCHEDULE_NAME_WASHING_MACHINE = "washingmachine_parse";
export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    logger.info(SCHEDULE_NAME_WASHING_MACHINE+" hook: init");

    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME_WASHING_MACHINE,getSchema);
    if (!allTablesExist) {
        return;
    }

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
            console.log(SCHEDULE_NAME_WASHING_MACHINE+" hook: update")
            try {
                if(!parseSchedule.parser){
                    // If no parser is set, ignore the update
                } else {
                    await parseSchedule.parse();
                }
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});
