import {WashingmachineParserInterface, WashingmachinesTypeForParser} from "./WashingmachineParserInterface";
import {ApiContext} from "../helpers/ApiContext";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {Washingmachines} from "../databaseTypes/types";

const SCHEDULE_NAME = "WashingmachineParseSchedule";

export class WashingmachineParseSchedule {

    private parser: WashingmachineParserInterface;
    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper;

    constructor(apiContext: ApiContext, parser: WashingmachineParserInterface) {
        this.apiContext = apiContext
        this.parser = parser
        this.myDatabaseHelper = new MyDatabaseHelper(this.apiContext);
    }

    async setStatus(status: FlowStatus) {
        await this.myDatabaseHelper.getAppSettingsHelper().setWashingmachineParsingStatus(status, new Date());
    }

    async isEnabled() {
        return await this.myDatabaseHelper.getAppSettingsHelper().isWashingmachineParsingEnabled();
    }

    async getStatus() {
        return await this.myDatabaseHelper.getAppSettingsHelper().getWashingmachineParsingStatus();
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()
        if (enabled && status === FlowStatus.START) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);

            try {
                let washingmachinesForParser = await this.parser.getWashingmachines();
                await this.updateWashingmachines(washingmachinesForParser);


                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"] Failed");
                console.log(err);

                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async updateWashingmachines(washingmachinesForParser: WashingmachinesTypeForParser[]) {
        for (let washingmachine of washingmachinesForParser) {
            await this.updateWashingmachine(washingmachine);
        }
    }

    async updateWashingmachine(washingmachine: WashingmachinesTypeForParser) {
        let itemsService = this.myDatabaseHelper.getWashingmachinesHelper();

        const external_identifier = washingmachine.basicData.external_identifier;
        const searchObject = {
            external_identifier: external_identifier
        }
        const createObject = searchObject;

        let foundItem = await itemsService.findOrCreateItem(searchObject, createObject);
        if(foundItem){
            const existingAlias = foundItem.alias
            const isExistingAlisNotEmpty = existingAlias && existingAlias.length > 0
            let newAlias = isExistingAlisNotEmpty ? existingAlias : washingmachine.basicData.alias

            let isJobStarting = foundItem.date_finished === null && washingmachine.basicData.date_finished !== null
            let isJobEnding = foundItem.date_finished !== null && washingmachine.basicData.date_finished === null

            const additionalWashingmachineData: Partial<Washingmachines> = {}

            if(isJobStarting) {
                additionalWashingmachineData.date_stated = new Date().toISOString()
            }
            if(isJobEnding) {
                additionalWashingmachineData.date_stated = null
            }

            await itemsService.updateOne(foundItem.id, {
                ...washingmachine.basicData,
                ...additionalWashingmachineData,
                alias: newAlias // do not overwrite alias if it is already set
            })

            let washingmachinesJobsService = this.myDatabaseHelper.getWashingmachinesJobsHelper();
            if(isJobEnding){
                await washingmachinesJobsService.createOne({
                    date_start: foundItem.date_stated,
                    date_end: washingmachine.basicData.date_finished,
                    washingmachine: foundItem.id,
                    apartment: foundItem.apartment
                })
            }


        }

    }

}
