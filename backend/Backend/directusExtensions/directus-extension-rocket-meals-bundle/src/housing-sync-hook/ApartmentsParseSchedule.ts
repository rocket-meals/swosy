import {ApiContext} from "../helpers/ApiContext";
import {ApartmentParserInterface, ApartmentsForParser} from "./ApartmentParserInterface";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";

const SCHEDULE_NAME = "ApartmentsParseSchedule";

export class ApartmentsParseSchedule {

    private parser: ApartmentParserInterface;
    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper;

    constructor(apiContext: ApiContext, parser: ApartmentParserInterface) {
        this.apiContext = apiContext;
        this.parser = parser;
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext);
    }

    async setStatus(status: FlowStatus) {
        await this.myDatabaseHelper.getAppSettingsHelper().setApartmentParsingStatus(status, new Date());
    }

    async isEnabled() {
        return await this.myDatabaseHelper.getAppSettingsHelper().isApartmentParsingEnabled();
    }

    async getStatus() {
        return await this.myDatabaseHelper.getAppSettingsHelper().getApartmentParsingStatus();
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        console.log("housing-sync-hook: parse: enabled: " + enabled + " status: " + status);

        if (enabled && status === FlowStatus.START) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);
            try {
                let apartmentsJSONList = await this.parser.getApartmentList();
                await this.updateApartments(apartmentsJSONList);

                console.log("Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("[MealParseSchedule] Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async findOrCreateApartment(apartmentForParser: ApartmentsForParser) {
        const itemService = this.myDatabaseHelper.getApartmentsHelper();
        const external_idenfifier = apartmentForParser.basicData.external_identifier;

        const searchObject = {
            external_identifier: external_idenfifier,
        }
        const createObject = searchObject;
        return await itemService.findOrCreateItem(searchObject, createObject);
    }

    async updateApartments(apartmentsForParser: ApartmentsForParser[]) {
        for (let apartmentForParser of apartmentsForParser) {
            let resource = await this.findOrCreateApartment(apartmentForParser);
            if (!!resource && resource?.id) {
                await this.updateApartment(resource.id, apartmentForParser);
            }
        }
    }

    async updateApartment(apartmentId: string, apartmentForParser: ApartmentsForParser) {
        const itemService = this.myDatabaseHelper.getApartmentsHelper();
        await itemService.updateOne(apartmentId, apartmentForParser.basicData);

        const building_data = apartmentForParser.buildingData;
        const buildingExternalIdentifier = building_data.external_identifier;
        const searchObject = {
            external_identifier: buildingExternalIdentifier,
        }
        const buildingService = this.myDatabaseHelper.getBuildingsHelper();
        const building = await buildingService.findOrCreateItem(searchObject, building_data);
        if (building) {
            const building_id = building.id;
            if(building_id) {
                // Link building to apartment
                await itemService.updateOne(apartmentId, {
                    building: building_id
                });
            }
        }
    }

}
