import hash from 'object-hash';
import {
    CanteensTypeForParser,
    FoodofferDateType,
    FoodoffersTypeForParser,
    FoodParserInterface,
    FoodsInformationTypeForParser,
    FoodWithBasicData
} from "./FoodParserInterface";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {MarkingParserInterface, MarkingsTypeForParser} from "./MarkingParserInterface";
import {ApiContext} from "../helpers/ApiContext";
import {AppSettingsHelper, FlowStatus} from "../helpers/itemServiceHelpers/AppSettingsHelper";
import {DateHelper} from "../helpers/DateHelper";
import {ListHelper} from "../helpers/ListHelper";
import {
    Canteens,
    Foodoffers, FoodoffersMarkings,
    Foods,
    FoodsMarkings,
    FoodsTranslations,
    Markings,
    MarkingsTranslations
} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {ItemsServiceHelper} from "../helpers/ItemsServiceHelper";
import {CollectionNames} from "../helpers/CollectionNames";
import {DictMarkingsExclusions, MarkingFilterHelper} from "../helpers/MarkingFilterHelper";
import PQueue from "p-queue";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";
import {MyTimer} from "../helpers/MyTimer";


const SCHEDULE_NAME = "FoodParseSchedule";

export class ParseSchedule {

    private foodParser: FoodParserInterface | null
    private markingParser: MarkingParserInterface | null;
    //private previousMealOffersHash: string | null; // in multi instance environment this should be a field in the database
    //private finished: boolean; // in multi instance environment this should be a field in the database
    private apiContext: ApiContext;
    private eventContext: EventContext;
    private myDatabaseHelper: MyDatabaseHelper;

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...
    private myAppSettingsHelper: AppSettingsHelper;

    constructor(apiContext: ApiContext, eventContext: EventContext, foodParser: FoodParserInterface | null, markingParser: MarkingParserInterface | null) {
        this.apiContext = apiContext;
        this.eventContext = eventContext;
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
        this.myAppSettingsHelper = this.myDatabaseHelper.getAppSettingsHelper();
        this.foodParser = foodParser;
        this.markingParser = markingParser;
    }

    async setStatus(status: FlowStatus) {
        await this.myAppSettingsHelper.setAppSettings({
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS]: status,
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_LAST_RUN]: new Date()
        })
    }

    async isEnabled() {
        return await this.myAppSettingsHelper.isFoodParsingEnabled();
    }

    async getStatus() {
        return await this.myAppSettingsHelper.getFoodParsingStatus();
    }

    async getHashOfJsonObject(object: any) {
        return hash(object, {
            algorithm: 'md5',
            excludeValues: false,
            ignoreUnknown: false
        });
    }

    async parse(force = false) {


        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        if ((enabled && status === FlowStatus.START) || force) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);

            try {
                if(!!this.markingParser){
                    console.log("["+SCHEDULE_NAME+"]"+" - Create Needed Data for MarkingParser");
                    await this.markingParser.createNeededData()
                    console.log("["+SCHEDULE_NAME+"]"+" - Update Markings")
                    let markingsJSONList = await this.markingParser.getMarkingsJSONList();
                    await this.updateMarkings(markingsJSONList);
                }

                if(!!this.foodParser){
                    console.log("["+SCHEDULE_NAME+"]"+" - Create Needed Data for FoodParser");
                    await this.foodParser.createNeededData()

                    let canteensJSONList = await this.foodParser.getCanteensList();
                    let foodsJSONList = await this.foodParser.getFoodsListForParser();
                    let foodofferListForParser = await this.foodParser.getFoodoffersForParser();
                    let currentMealOffersHash = await this.getHashOfJsonObject(foodofferListForParser);
                    let previousMealOffersHash = await this.myAppSettingsHelper.getFoodParsingHash();
                    const markingsExclusionsHelper = this.myDatabaseHelper.getMarkingsExclusionsHelper();


                    console.log("["+SCHEDULE_NAME+"]"+" - Current meal offers hash: " + currentMealOffersHash);
                    console.log("["+SCHEDULE_NAME+"]"+" - Check if meal offers changed")
                    const mealOffersChanged = !previousMealOffersHash || previousMealOffersHash !== currentMealOffersHash;
                    if(mealOffersChanged){
                        console.log("["+SCHEDULE_NAME+"]"+" - Set previous meal offers hash");
                        await this.myAppSettingsHelper.setFoodParsingHash(currentMealOffersHash);

                        console.log("["+SCHEDULE_NAME+"]"+" - Update Canteens")
                        await this.updateCanteens(canteensJSONList);

                        console.log("["+SCHEDULE_NAME+"]"+" - Get all markings exlusions")
                        let markingsExclusions = await markingsExclusionsHelper.readAllItems();
                        const dictMarkingsExclusions: DictMarkingsExclusions = MarkingFilterHelper.getDictMarkingsExclusions(markingsExclusions);

                        console.log("["+SCHEDULE_NAME+"]"+" - Update Foods")
                        await this.updateFoods(foodsJSONList, dictMarkingsExclusions);

                        console.log("["+SCHEDULE_NAME+"]"+" - Delete specific food offers");
                        await this.deleteRequiredFoodOffersForTheirCanteens(foodofferListForParser);

                        console.log("["+SCHEDULE_NAME+"]"+" - Create food offers");
                        await this.createFoodOffers(foodofferListForParser, dictMarkingsExclusions);
                    }
                }

                console.log("["+SCHEDULE_NAME+"]"+" - Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"]"+" - Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async getFoodsService() {
        return await this.myDatabaseHelper.getFoodsHelper();
    }

    getFoodofferDatesFromRawFoodofferJSONList(foodoffersForParser: FoodoffersTypeForParser[]): FoodofferDateType[] {
        let isoDatesStringDict: { [key: string]: FoodofferDateType } = {};
        for (let foodofferForParser of foodoffersForParser) {
            const directusDateOnlyFormat = DateHelper.foodofferDateTypeToString(foodofferForParser.date);
            isoDatesStringDict[directusDateOnlyFormat] = foodofferForParser.date;
        }
        let foodofferDates = Object.values(isoDatesStringDict);
        return foodofferDates;
    }


    /**
     * As we recieved a new food offer list, we delete all offers that are in the future and newer than the latest date in the list.
     * @param foodofferDatesToDelete
     */
    async deleteRequiredFoodOffersForTheirCanteens(foodoffersForParser: FoodoffersTypeForParser[]) {
        let foodoffersForParserGroupedByCanteen: Record<string, FoodoffersTypeForParser[]> = {};
        for (let foodofferForParser of foodoffersForParser) {
            let key = foodofferForParser.canteen_external_identifier;
            if (!foodoffersForParserGroupedByCanteen[key]) {
                foodoffersForParserGroupedByCanteen[key] = [];
            }
            foodoffersForParserGroupedByCanteen[key].push(foodofferForParser);
        }

        let canteenExternalIdentifiers = Object.keys(foodoffersForParserGroupedByCanteen);
        for (let canteenExternalIdentifier of canteenExternalIdentifiers) {
            console.log("[" + SCHEDULE_NAME + "]" + " - Delete required foodoffers for canteen: " + canteenExternalIdentifier);
            let canteen = await this.findOrCreateCanteenByExternalIdentifier(canteenExternalIdentifier);
            if (!!canteen) {

                // first delete all food offers for canteen without dates
                let foodoffers_import_delete_all_without_dates = canteen.foodoffers_import_delete_all_without_dates
                if (foodoffers_import_delete_all_without_dates) {
                    await this.deleteAllFoodoffersForCanteenWithoutDates(canteen);
                }

                // now delete all food offers that are in the future and newer than the latest date in the list
                let foodoffersForParserForCanteen = foodoffersForParserGroupedByCanteen[canteenExternalIdentifier] || [];
                let foodofferDatesToDelete = this.getFoodofferDatesFromRawFoodofferJSONList(foodoffersForParserForCanteen);
                await this.deleteFoodOffersNewerOrEqualThanDate(foodofferDatesToDelete, canteen);
            }
        }
    }

    async deleteAllFoodoffersForCanteenWithoutDates(canteen: Canteens) {
        let itemService = await this.myDatabaseHelper.getFoodoffersHelper();
        let itemsToDelete = await itemService.readByQuery({
            filter: {
                canteen: {
                    _eq: canteen.id
                },
                date: {
                    _null: true
                }
            },
            fields: ['id'], // Assuming 'id' is the primary key field
            limit: -1
        });
        await this.deleteFoodOffers(itemsToDelete, `Delete all food offers for canteen without dates: ${canteen.id} - amount: ${itemsToDelete.length}`);
    }

    async deleteFoodOffersNewerOrEqualThanDate(foodofferDatesToDelete: FoodofferDateType[], canteen: Canteens) {
        let oldestFoodofferDate: FoodofferDateType | null = null;
        for (let foodofferDateToDelete of foodofferDatesToDelete) {
            let foodofferDateToDeleteAsDate = new Date(DateHelper.foodofferDateTypeToString(foodofferDateToDelete));

            if (!!oldestFoodofferDate) {
                let oldestFoodofferDateAsDate = new Date(DateHelper.foodofferDateTypeToString(oldestFoodofferDate))
                if(foodofferDateToDeleteAsDate < oldestFoodofferDateAsDate){
                    oldestFoodofferDate = foodofferDateToDelete;
                }
            } else {
                oldestFoodofferDate = foodofferDateToDelete;
            }
        }
        if(!!oldestFoodofferDate){
            // add one day to the latest date and format it to iso8601
            //oldestFoodofferDate.setDate(oldestFoodofferDate.getDate() + 1);
            //let latestPlusOneDayIso8601StringDate = DateHelper.formatDateToIso8601WithoutTimezone(oldestFoodofferDate);
            //let nowAsIso8601StringDate = DateHelper.formatDateToIso8601WithoutTimezone(new Date());
            // if the latest date is in the future, we delete all offers that are newer or equal to latestPlusOneDayIso8601StringDate
            // we do only delete offers in the future automatically, as we do not want to delete offers that are in the past
            // - Why not? When we receive a new list of food offers, we want to delete all offers that are in the future and newer than the latest date in the list.
            //if(new Date(latestPlusOneDayIso8601StringDate) > new Date(nowAsIso8601StringDate)){
            //    await this.deleteAllFoodOffersNewerOrEqualThanDate(latestPlusOneDayIso8601StringDate);
            //}

            console.log("["+SCHEDULE_NAME+"]"+" - Delete specific food offers");
            console.log("oldestFoodofferDate: ")
            console.log(oldestFoodofferDate)
            await this.deleteAllFoodOffersNewerOrEqualThanDateForCanteen(oldestFoodofferDate, canteen);
        }
    }

    async deleteFoodOffers(foodoffers: Foodoffers[], notice: string) {
        let itemService = await this.myDatabaseHelper.getFoodoffersHelper();
        let idsToDelete = foodoffers.map(item => item.id);

        // Step 2: Delete the items using their IDs
        if (idsToDelete.length > 0) {
            await itemService.deleteMany(idsToDelete).then(() => {
                console.log(`Foodoffers deleted: ${idsToDelete.length} - ${notice}`);
            }).catch(error => {
                console.error(`Foodoffers delete error: ${notice}:`, error);
            });
        } else {
            console.log(`No foodoffers given to delete - ${notice}`);
        }
    }

    async deleteAllFoodOffersNewerOrEqualThanDateForCanteen(iso8601StringDate: FoodofferDateType, canteen: Canteens) {
        const directusDateOnlyString = DateHelper.foodofferDateTypeToString(iso8601StringDate)
        console.log("["+SCHEDULE_NAME+"]"+" - Delete food offers newer or equal than date: " + directusDateOnlyString);

        let itemService = await this.myDatabaseHelper.getFoodoffersHelper();
        //await itemService.deleteByQuery()
        // TODO: Überprüfen ob deleteByQuery funktioniert und ob es dadurch schneller geht bzw. es zu einem Blockieren der Datenbank kommt

        let itemsToDelete = await itemService.readByQuery({
            filter: {
                _and: [
                    {
                        date: {
                            _gte: directusDateOnlyString
                        }
                    },
                    {
                        canteen: {
                            _eq: canteen.id
                        }
                    }
                ]
            },
            fields: ['id'], // Assuming 'id' is the primary key field
            limit: -1
        });

        await this.deleteFoodOffers(itemsToDelete, `Delete all food offers newer or equal than date: ${directusDateOnlyString} for canteen: ${canteen.id}`);
    }

    async findOrCreateMarkingByExternalIdentifier(marking_external_identifier: string) {
        let searchJSON = {
            external_identifier: marking_external_identifier
        };
        let createJSON = {
            alias: marking_external_identifier,
            external_identifier: marking_external_identifier,
        };
        return this.myDatabaseHelper.getMarkingsHelper().findOrCreateItem(searchJSON, createJSON);
    }

    async findOrCreateMarkingsByExternalIdentifierList(markings_external_identifiers: string[]): Promise<Markings[]> {
        let markings: Markings[] = [];
        for (let marking_external_identifier of markings_external_identifiers) {
            let marking = await this.findOrCreateMarkingByExternalIdentifier(marking_external_identifier);
            if(marking){
                markings.push(marking);
            }
        }
        return markings;
    }

    async updateCanteens(canteenList: CanteensTypeForParser[]): Promise<void> {
        let amountOfCanteens = canteenList.length;
        let currentCanteen = 0;
        for (let canteen of canteenList) {
            currentCanteen++;
            console.log("["+SCHEDULE_NAME+"]"+" - Update Canteen " + currentCanteen + " / " + amountOfCanteens);
            let canteenFoundOrCreated = await this.findOrCreateCanteen(canteen);
            if (!!canteenFoundOrCreated) {
                let canteensHelper = this.myDatabaseHelper.getCanteensHelper();
                await canteensHelper.updateOne(canteenFoundOrCreated.id, canteen);
            }
        }
    }

    async assignMarkingsToFood(markings: Markings[], food: Foods, dictMarkingsExclusions: DictMarkingsExclusions) {
        let tablename = CollectionNames.FOODS_MARKINGS;

        const filteredMarkings = MarkingFilterHelper.filterMarkingByRestrictionRules(markings, dictMarkingsExclusions);
        for (let marking of filteredMarkings) {
            let food_marking_json = {foods_id: food.id, markings_id: marking.id};
            const searchJSON = food_marking_json;
            const createJSON = food_marking_json;

            const foodMarkingsHelper = new ItemsServiceHelper<FoodsMarkings>(this.apiContext, tablename, this.eventContext);
            await foodMarkingsHelper.findOrCreateItem(searchJSON, createJSON);
        }
    }

    async assignMarkingsToFoodoffer(markings: Markings[], foodoffer: Foodoffers, dictMarkingsExclusions: DictMarkingsExclusions) {
        let tablename = CollectionNames.FOODOFFER_MARKINGS

        const filteredMarkings = MarkingFilterHelper.filterMarkingByRestrictionRules(markings, dictMarkingsExclusions);

        for (let marking of filteredMarkings) {
            let foodoffer_marking_json = {foodoffers_id: foodoffer.id, markings_id: marking.id};
            const foodMarkingsHelper = new ItemsServiceHelper<FoodoffersMarkings>(this.apiContext, tablename, this.eventContext);
            await foodMarkingsHelper.createOne(foodoffer_marking_json);
        }
    }

    async updateFoodBasicFields(food: FoodWithBasicData){
        return this.myDatabaseHelper.getFoodsHelper().updateOne(food.id, food);
    }

    async updateFoodTranslations(food: Foods, foodsInformationForParser: FoodsInformationTypeForParser) {
        await TranslationHelper.updateItemTranslations<Foods, FoodsTranslations>(food, foodsInformationForParser.translations, "foods_id", CollectionNames.FOODS, this.apiContext, this.eventContext);
    }

    async updateFoods(foodsInformationForParserList: FoodsInformationTypeForParser[], dictMarkingsExclusions: DictMarkingsExclusions) {
        //let amountOfMeals = foodsInformationForParserList.length;
        let currentFoodIndex = 0;

        foodsInformationForParserList = ListHelper.removeDuplicatesFromJsonListWithSelector(foodsInformationForParserList, (
            foodsInformationForParser: FoodsInformationTypeForParser
        ) => {
            return foodsInformationForParser.basicFoodData.id;
            }
        ); // Remove duplicates https://github.com/rocket-meals/rocket-meals/issues/151

        // create dict with all marking external identifiers
        const dictMarkingExternalIdentifierToMarking: Record<string, Markings | null> = {};
        for(let foodsInformationForParser of foodsInformationForParserList){
            let marking_external_identifiers = foodsInformationForParser.marking_external_identifiers;
            for(let marking_external_identifier of marking_external_identifiers){
                dictMarkingExternalIdentifierToMarking[marking_external_identifier] = null;
            }
        }

        // create markings
        let markingExternalIdentifiers = Object.keys(dictMarkingExternalIdentifierToMarking);
        for (let markingExternalIdentifier of markingExternalIdentifiers) {
            let marking = await this.findOrCreateMarkingByExternalIdentifier(markingExternalIdentifier);
            if(!!marking){
                dictMarkingExternalIdentifierToMarking[markingExternalIdentifier] = marking;
            }
        }

        const myTimer = new MyTimer(SCHEDULE_NAME+ " - Update Food");

        // Initialize the queue with a concurrency of 100
        const queue = new PQueue({ concurrency: 1000 });

        let amountCompleted = 0;

        const tasks = foodsInformationForParserList.map((foodsInformationForParser, index) => {
            return queue.add(async () => {
                //console.log("["+SCHEDULE_NAME+"]"+" - Start Update Food " + (index + 1) + " / " + foodsInformationForParserList.length);
                const basicFoodData = foodsInformationForParser.basicFoodData;
                let searchJSON = {
                    id: basicFoodData.id,
                }
                let foundFood = await this.myDatabaseHelper.getFoodsHelper().findOrCreateItem(searchJSON, searchJSON);
                if (!!foundFood && foundFood.id && this.foodParser) {

                    let marking_external_identifier_list = foodsInformationForParser.marking_external_identifiers;
                    let markings: Markings[] = [];
                    for (let marking_external_identifier of marking_external_identifier_list) {
                        let marking = dictMarkingExternalIdentifierToMarking[marking_external_identifier];
                        if(!!marking){
                            markings.push(marking);
                        }
                    }
                    await this.assignMarkingsToFood(markings, foundFood, dictMarkingsExclusions);

                    await this.updateFoodBasicFields(basicFoodData);

                    await this.updateFoodTranslations(foundFood, foodsInformationForParser);

                    //console.log("["+SCHEDULE_NAME+"]"+" - Finished Update Food " + (index + 1) + " / " + foodsInformationForParserList.length);
                    amountCompleted++;
                    myTimer.printEstimatedTimeRemaining(amountCompleted, foodsInformationForParserList.length);
                }
            });
        });

        // Wait for all tasks in the queue to be processed
        await queue.onIdle();

        console.log("["+SCHEDULE_NAME+"]"+" - Finished Update Foods");
    }


    async findOrCreateCanteen(canteen: CanteensTypeForParser) {
        let searchJSON = {
            external_identifier: canteen.external_identifier
        }
        let createJSON = canteen
        return await this.myDatabaseHelper.getCanteensHelper().findOrCreateItem(searchJSON, createJSON);
    }

    async findOrCreateCanteenByExternalIdentifier(external_identifier: string) {
        let searchJSON: CanteensTypeForParser = {
            external_identifier: external_identifier
        }
        return await this.findOrCreateCanteen(searchJSON);
    }


    async createFoodOffer(foodofferForParser: FoodoffersTypeForParser, dictMarkingsExclusions: DictMarkingsExclusions, canteen: Canteens, markings: Markings[]) {
        const foodoffersHelper = this.myDatabaseHelper.getFoodoffersHelper();

        let food_id = foodofferForParser.food_id
        const foodsService = await this.getFoodsService();
        let foodFound = await foodsService.readOne(food_id);
        if (!!foodFound) { // Check if meal exists
            const basicFoodofferData = foodofferForParser.basicFoodofferData;

            if(!basicFoodofferData.alias){ // If alias is not set, try to get it from meal
                basicFoodofferData.alias = foodFound.alias; // Add alias to meal offer from meal
            }
            const foodoffers_import_without_date = !!canteen.foodoffers_import_without_date
            const date = foodoffers_import_without_date ? null : DateHelper.foodofferDateTypeToString(foodofferForParser.date);

            const markingsCreate: any[] = markings.map(marking => {
                return {
                    foodoffers_id: "+",
                    markings_id: {
                        id: marking.id
                    }
                }
            });

            let foodOfferToCreate: Foodoffers = {
                ...foodofferForParser.basicFoodofferData,
                canteen: canteen.id,
                food: food_id,
                date: date,
                date_created: new Date().toISOString(),
                date_updated: new Date().toISOString(),
                markings: {
                    // @ts-ignore
                    "create": markingsCreate,
                    "update": [],
                    "delete": []
                }
            }

            let foodoffer_id = await foodoffersHelper.createOne(foodOfferToCreate);

            // replaced by directly assigning markings to foodoffer in the createOne method
            //let foodoffer = await foodoffersHelper.readOne(foodoffer_id);

            //if (!!foodoffer) {
            //    await this.assignMarkingsToFoodoffer(markings, foodoffer, dictMarkingsExclusions);
            //}
        }
    }

    async createFoodOffers(foodofferListForParser: FoodoffersTypeForParser[], dictMarkingsExclusions: DictMarkingsExclusions) {
        const amountOfRawMealOffers = foodofferListForParser.length;
        console.log("["+SCHEDULE_NAME+"]"+" - Create Food Offers");

        const dictCanteenExternalIdentifierToCanteen: Record<string, Canteens | null> = {};
        const dictMarkingExternalIdentifierToMarking: Record<string, Markings |null> = {};

        // fill the dicts with null values
        for (let foodofferForParser of foodofferListForParser) {
            let canteen_external_identifier = foodofferForParser.canteen_external_identifier;
            dictCanteenExternalIdentifierToCanteen[canteen_external_identifier] = null;

            let marking_external_identifiers = foodofferForParser.marking_external_identifiers;
            for (let marking_external_identifier of marking_external_identifiers) {
                dictMarkingExternalIdentifierToMarking[marking_external_identifier] = null;
            }
        }

        // create canteens
        let canteenExternalIdentifiers = Object.keys(dictCanteenExternalIdentifierToCanteen);
        for (let canteenExternalIdentifier of canteenExternalIdentifiers) {
            let canteen = await this.findOrCreateCanteenByExternalIdentifier(canteenExternalIdentifier);
            if(!!canteen){
                dictCanteenExternalIdentifierToCanteen[canteenExternalIdentifier] = canteen;
            }
        }

        // create markings
        let markingExternalIdentifiers = Object.keys(dictMarkingExternalIdentifierToMarking);
        for (let markingExternalIdentifier of markingExternalIdentifiers) {
            let marking = await this.findOrCreateMarkingByExternalIdentifier(markingExternalIdentifier);
            if(!!marking){
                dictMarkingExternalIdentifierToMarking[markingExternalIdentifier] = marking;
            }
        }

        // Initialize the queue with a concurrency of 100
        const queue = new PQueue({ concurrency: 1000 });

        let amountCompleted = 0;
        const myTimer = new MyTimer(SCHEDULE_NAME+ " - Create Food Offers");

        const tasks = foodofferListForParser.map((foodofferForParser, index) => {
            return queue.add(async () => {
                //console.log("["+SCHEDULE_NAME+"] - Start Create Food Offer " + (index + 1) + " / " + amountOfRawMealOffers);

                const canteen = dictCanteenExternalIdentifierToCanteen[foodofferForParser.canteen_external_identifier];
                const marking_external_identifiers = foodofferForParser.marking_external_identifiers;
                const markings: Markings[] = [];

                for (let marking_external_identifier of marking_external_identifiers) {
                    const marking = dictMarkingExternalIdentifierToMarking[marking_external_identifier];
                    if (marking) {
                        markings.push(marking);
                    }
                }

                if (canteen) {
                    await this.createFoodOffer(foodofferForParser, dictMarkingsExclusions, canteen, markings);
                    //console.log("["+SCHEDULE_NAME+"] - Finished Create Food Offer " + (index + 1) + " / " + amountOfRawMealOffers);
                    amountCompleted++;
                    //console.log("["+SCHEDULE_NAME+"]"+" - Update Foodoffers Completed " + amountCompleted + " / " + amountOfRawMealOffers);
                }

                myTimer.printElapsedTimeAndEstimatedTimeRemaining(amountCompleted, amountOfRawMealOffers);
            });
        });

        // Wait for all tasks in the queue to be processed
        await queue.onIdle();
    }

    async updateMarkings(markingsJSONList: MarkingsTypeForParser[]) {
        let itemService = await this.myDatabaseHelper.getMarkingsHelper();

        markingsJSONList = ListHelper.removeDuplicatesFromJsonList(markingsJSONList, "external_identifier");// Remove duplicates https://github.com/rocket-meals/rocket-meals/issues/151

        let amountOfMarkings = markingsJSONList.length;
        let currentMarking = 0;
        for (let markingJSON of markingsJSONList) {
            currentMarking++;
            console.log("["+SCHEDULE_NAME+"]"+" - Update Marking " + currentMarking + " / " + amountOfMarkings);
            console.log(markingJSON)

            let markingJSONCopy = JSON.parse(JSON.stringify(markingJSON));
            delete markingJSONCopy.translations; // Remove meals translations, add it later

            let markings = await itemService.readByQuery({
                filter: { external_identifier: markingJSONCopy.external_identifier },
                limit: 1
            });

            let marking = markings.length > 0 ? markings[0] : null;

            if (!marking) {
                // If marking does not exist, create a new one
                let adaptedMarkingJSON: Partial<Markings> = {
                    ...markingJSONCopy,
                    short_code: markingJSONCopy.external_identifier // Set short_code to external_identifier
                }

                let marking_id = await itemService.createOne(adaptedMarkingJSON);
                marking = await itemService.readOne(marking_id);
            } else {
                // If marking exists, don't update it, as it could be changed by the user
                // We already set all fields in the createOne method
                //await itemService.updateOne(marking.id, markingJSONCopy);
            }

            if (marking && marking.id) {
                await this.updateMarkingTranslations(marking, markingJSON);
            }
        }
    }


    async updateMarkingTranslations(marking: Markings, markingJSON: MarkingsTypeForParser) {
        await TranslationHelper.updateItemTranslations<Markings, MarkingsTranslations>(marking, markingJSON.translations, "markings_id", CollectionNames.MARKINGS, this.apiContext, this.eventContext);
    }

}
