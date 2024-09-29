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
                let washingmachinesForParserRecheck = await this.parser.getWashingmachines();
                // sometimes the service endpoint is not reliable, so we check twice

                // then we check if the data is the same
                let areEqual = this.checkIfArraysOfWashingmachinesAreEqual(washingmachinesForParser, washingmachinesForParserRecheck);
                if(areEqual){
                    await this.updateWashingmachines(washingmachinesForParser);
                }

                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"] Failed");
                console.log(err);

                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    checkIfArraysOfWashingmachinesAreEqual(washingmachines1: WashingmachinesTypeForParser[], washingmachines2: WashingmachinesTypeForParser[]) {
        if (washingmachines1.length !== washingmachines2.length) {
            return false;
        }

        for (let i = 0; i < washingmachines1.length; i++) {
            let washingmachine1 = washingmachines1[i];
            let washingmachine2 = washingmachines2[i];
            if(!!washingmachine1 && !!washingmachine2) {
                let keysOfBasicData = Object.keys(washingmachine1.basicData);
                for (let key of keysOfBasicData) {
                    let keyOfBasicData = key as keyof typeof washingmachine1.basicData;

                    let value1 = washingmachine1?.basicData?.[keyOfBasicData];
                    let value2 = washingmachine2?.basicData?.[keyOfBasicData];
                    if (value1 !== value2) {
                        return false;
                    }
                }
            }
        }

        return true;
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

            let isJobStarting = foundItem.date_finished === null && washingmachine.basicData.date_finished !== null // maybe the finish time is just extended
            let isJobEnding = washingmachine.basicData.date_finished === null // but if the finish time is null, the job is ending

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
        }

    }

}
