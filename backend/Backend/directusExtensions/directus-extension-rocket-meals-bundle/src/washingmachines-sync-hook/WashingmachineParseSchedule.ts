import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {WashingmachineParserInterface, WashingmachinesTypeForParser} from "./WashingmachineParserInterface";
import {ApiContext} from "../helpers/ApiContext";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
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
        let itemsServiceCreator = new ItemsServiceCreator(this.apiContext)
        let itemsService = await itemsServiceCreator.getItemsService<Washingmachines>(CollectionNames.WASHINGMACHINES)

        const external_identifier = washingmachine.basicData.external_identifier;
        const searchQuery = {
            filter: {
                external_identifier: {
                    _eq: external_identifier
                }
            }
        }

        let foundItems = await itemsService.readByQuery(searchQuery)
        if (foundItems.length === 0) {
            await itemsService.createOne({
                external_identifier: washingmachine.basicData.external_identifier
            })
        }
        foundItems = await itemsService.readByQuery(searchQuery)
        let foundItem = foundItems[0]
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
