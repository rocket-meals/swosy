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
import {FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {Washingmachines} from "../databaseTypes/types";

export const SCHEDULE_NAME_WASHING_MACHINE = "washingmachine_parse";
export default defineHook(async ({action, filter, init}, apiContext) => {
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

    // Washingmachines Jobs Creation
    filter(CollectionNames.WASHINGMACHINES+'.items.update', async (input: any, {keys, collection}, eventContext) => {
        // Fetch the current item from the database
        if (!keys || keys.length === 0) {
            throw new Error("No keys provided for update");
        }
        let washingmachines_ids = keys;
        let washingmachine_new: Partial<Washingmachines> = input;
        let new_date_finished = washingmachine_new.date_finished;

        const hasWashingmachineNewPropertyDateFinished = Object.prototype.hasOwnProperty.call(washingmachine_new, 'date_finished');

        if(hasWashingmachineNewPropertyDateFinished && new_date_finished===null){
            let myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
            if(!!washingmachines_ids) {
                for (let washingmachine_id of washingmachines_ids) {
                    let washingmachine_curent = await myDatabaseHelper.getWashingmachinesHelper().readOne(washingmachine_id);

                    let current_date_stated = washingmachine_curent.date_stated;
                    let current_date_finished = washingmachine_curent.date_finished;

                    if (!!current_date_stated && !!current_date_finished) { // currently washing
                        // then save it as a finished washing job
                        let time_diff = new Date(current_date_finished).getTime() - new Date(current_date_stated).getTime();
                        if (time_diff > 0) {
                            let time_hours = parseInt(time_diff / 1000 / 60 / 60 + "");
                            let time_minutes = parseInt(time_diff / 1000 / 60 % 60 + "");
                            let time_seconds = parseInt(time_diff / 1000 % 60 + "");
                            let hh_mm_ss = time_hours + ":" + time_minutes + ":" + time_seconds;

                            const duration_in_minutes = parseInt(time_diff / 1000 / 60 + "");

                            await myDatabaseHelper.getWashingmachinesJobsHelper().createOne({
                                date_start: current_date_stated,
                                date_end: current_date_finished,
                                duration_calculated: hh_mm_ss,
                                duration_in_minutes_calculated: duration_in_minutes,
                                washingmachine: washingmachine_curent.id,
                                apartment: washingmachine_curent.apartment
                            });
                        }

                    }
                }
            }
        }

        return input;
    });
});
