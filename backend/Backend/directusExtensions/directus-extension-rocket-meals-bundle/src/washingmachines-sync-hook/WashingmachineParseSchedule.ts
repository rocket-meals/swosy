import {WashingmachineParserInterface, WashingmachinesTypeForParser} from "./WashingmachineParserInterface";
import {ApiContext} from "../helpers/ApiContext";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";

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

            await itemsService.updateOne(foundItem.id, {
                ...washingmachine.basicData,
                alias: newAlias // do not overwrite alias if it is already set
            })
        }

    }

}
