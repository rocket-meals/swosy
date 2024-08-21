import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {ApartmentParserInterface, ApartmentsForParser} from "./ApartmentParserInterface";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {Apartments, Buildings} from "../databaseTypes/types";

const TABLENAME_APARTMENTS = CollectionNames.APARTMENTS;
const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS;

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
        const itemServiceCreate = new ItemsServiceCreator(this.apiContext);
        const itemService = await itemServiceCreate.getItemsService<Apartments>(TABLENAME_APARTMENTS);
        const external_idenfifier = apartmentForParser.basicData.external_identifier;

        const searchQuery = {
            filter: {
                external_identifier: {
                    _eq: external_idenfifier
                }
            }
        }
        let items = await itemService.readByQuery(searchQuery);
        if (items?.length > 0) {
            return items[0];
        } else {
            await itemService.createOne({
                external_identifier: external_idenfifier,
            });
            items = await itemService.readByQuery(searchQuery);
            return items[0];
        }
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
        const itemServiceCreate = new ItemsServiceCreator(this.apiContext);
        const itemService = await itemServiceCreate.getItemsService<Apartments>(TABLENAME_APARTMENTS);
        await itemService.updateOne(apartmentId, apartmentForParser.basicData);

        const building_data = apartmentForParser.buildingData;
        const buildingExternalIdentifier = building_data.external_identifier;
        const searchQuery = {
            filter: {
                external_identifier: {
                    _eq: buildingExternalIdentifier
                }
            }
        }
        const buildingService = await itemServiceCreate.getItemsService<Buildings>(CollectionNames.BUILDINGS);
        let buildings = await buildingService.readByQuery(searchQuery);
        if (buildings?.length > 0) {
            await buildingService.createOne({
                external_identifier: buildingExternalIdentifier,
            });
        }
        buildings = await buildingService.readByQuery(searchQuery);
        if (buildings?.length > 0) {
            const building_id = buildings[0]?.id;
            if(building_id) {
                await buildingService.updateOne(building_id, building_data);

                // Link building to apartment
                await itemService.updateOne(apartmentId, {
                    building: building_id
                });
            }
        }
    }

}
