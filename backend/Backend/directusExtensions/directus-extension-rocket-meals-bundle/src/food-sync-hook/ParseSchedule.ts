import hash from 'object-hash';
import {AbstractService, FileServiceCreator, ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {
    CanteensTypeForParser, FoodofferDateType,
    FoodoffersTypeForParser,
    FoodofferTypeForCreation,
    FoodParserInterface,
    FoodsInformationTypeForParser,
    FoodWithBasicData
} from "./FoodParserInterface";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {MarkingParserInterface, MarkingsTypeForParser} from "./MarkingParserInterface";
import {SWOSY_API_Parser} from "./SWOSY_API_Parser";
import {ApiContext} from "../helpers/ApiContext";
import {AppSettingsHelper, FlowStatus} from "../helpers/AppSettingsHelper";
import {DateHelper} from "../helpers/DateHelper";
import {ListHelper} from "../helpers/ListHelper";
import {
    Canteens,
    Foodoffers,
    Foods,
    FoodsMarkings,
    FoodsTranslations,
    Markings,
    MarkingsTranslations
} from "../databaseTypes/types";
import {ItemsServiceHelper} from "../helpers/ItemsServiceHelper";

const TABLENAME_FOODS = CollectionNames.FOODS;
const TABLENAME_MEAL_MARKINGS = CollectionNames.FOODS_MARKINGS;
const TABLENAME_FOODOFFERS = CollectionNames.FOODOFFERS;
const TABLENAME_CANTEENS = CollectionNames.CANTEENS;
const TABLENAME_MARKINGS = CollectionNames.MARKINGS;
const TABLENAME_MEALFOFFERS_MARKINGS = CollectionNames.FOODOFFER_MARKINGS

const SCHEDULE_NAME = "FoodParseSchedule";

export class ParseSchedule {

    private foodParser: FoodParserInterface | null
    private markingParser: MarkingParserInterface | null;
    //private previousMealOffersHash: string | null; // in multi instance environment this should be a field in the database
    //private finished: boolean; // in multi instance environment this should be a field in the database
    private apiContext: ApiContext;
    private itemsServiceCreator: ItemsServiceCreator;

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...
    private myAppSettingsHelper: AppSettingsHelper;

    constructor(apiContext: ApiContext, foodParser: FoodParserInterface | null, markingParser: MarkingParserInterface | null) {
        this.apiContext = apiContext;
        this.itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        this.myAppSettingsHelper = new AppSettingsHelper(apiContext);
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


                    console.log("["+SCHEDULE_NAME+"]"+" - Current meal offers hash: " + currentMealOffersHash);
                    console.log("["+SCHEDULE_NAME+"]"+" - Check if meal offers changed")
                    const mealOffersChanged = !previousMealOffersHash || previousMealOffersHash !== currentMealOffersHash;
                    if(mealOffersChanged){
                        console.log("["+SCHEDULE_NAME+"]"+" - Set previous meal offers hash");
                        await this.myAppSettingsHelper.setFoodParsingHash(currentMealOffersHash);

                        console.log("["+SCHEDULE_NAME+"]"+" - Update Canteens")
                        await this.updateCanteens(canteensJSONList);

                        console.log("["+SCHEDULE_NAME+"]"+" - Update Foods")
                        await this.updateFoods(foodsJSONList);

                        console.log("["+SCHEDULE_NAME+"]"+" - Delete specific food offers");
                        let foodoffersToDelete = this.getFoodofferDatesFromRawFoodofferJSONList(foodofferListForParser);
                        //await this.deleteAllFoodOffersWithDates(foodoffersToDelete);
                        await this.deleteAllFoodOffersFromTheEarliestFoodofferDateUpToTheFuture(foodoffersToDelete);

                        console.log("["+SCHEDULE_NAME+"]"+" - Create food offers");
                        await this.createFoodOffers(foodofferListForParser);
                    }
                }

                await this.reimportImages();

                console.log("["+SCHEDULE_NAME+"]"+" - Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"]"+" - Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async reimportImages() {
        // TODO: Remove this after switched to new project
        console.log("["+SCHEDULE_NAME+"]"+" - Check for image synchronize");
        console.log("["+SCHEDULE_NAME+"]"+" - -- TODO: Remove this after switched to new project --");
        try{
            await this.checkForImageSynchronize();
        } catch (err) {
            console.log("["+SCHEDULE_NAME+"]"+" - Error while checking for image synchronize");
            console.log(err);
        }
    }

    async getFoodsService(): Promise<AbstractService<Foods>>{
        return await this.itemsServiceCreator.getItemsService<Foods>(TABLENAME_FOODS);
    }

    async checkForImageSynchronize(){
        const env = this.apiContext.env
        //console.log(SCHEDULE_NAME + ": Checking for image synchronize");
        const FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY = env.FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY;
        const FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL = env.FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL;

        const fileServiceCreator = new FileServiceCreator(this.apiContext);

        const canImportImages = FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY && FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL;
        if(canImportImages){
            console.log(SCHEDULE_NAME + ": Importing images from a extern SWOSY API: " + FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL);
            const foodsService = await this.getFoodsService();
            const meals = await foodsService.readByQuery({
                limit: -1
            });


            let amountMeals = meals.length;
            let amountMealsImagesImported = 0;
            let amountMealsWithoutImage = 0;
            let amountProcessed = 0;

            console.log(SCHEDULE_NAME + ": Found " + meals.length + " meals");
            for(const meal of meals) {
                if (!meal.image) {
                    amountMealsWithoutImage++;
                }
            }

            for(const meal of meals) {
                amountProcessed++;
                const meal_id = meal.id;

                if (meal.image) {
                    //console.log(SCHEDULE_NAME + ": Meal " + meal_id + " already has an image");
                } else {
                    //console.log(SCHEDULE_NAME + ": Meal " + meal_id + " has no image");
                    const swosyImageUrl = SWOSY_API_Parser.getImageRemoteUrlForMealId(FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL, meal.id);
                    if(swosyImageUrl) {
                        //console.log(SCHEDULE_NAME + ": Trying to import image for meal " + meal_id + " from " + swosyImageUrl);

                        //https://github.com/directus/directus/blob/main/api/src/services/files.ts
                        const optionalFileParams: Partial<File> = {
                            // @ts-ignore
                            filename_download: meal_id + ".jpg",
                            title: meal_id,
                            folder: "7ca24fe5-f805-432a-a52e-623682eef9dc", // Folder ID for "Foods"
                        }

                        try{
                            let file_id = await fileServiceCreator.importByUrl(swosyImageUrl, optionalFileParams);
                            if(file_id) {
                                console.log(SCHEDULE_NAME + ": Imported image for meal " + meal_id + " with file id " + file_id);
                                await foodsService.updateOne(meal_id, {
                                    image: file_id
                                });
                                amountMealsImagesImported++;
                            } else {
                                console.log(SCHEDULE_NAME + ": Unknown Error while importing image for meal " + meal_id);
                            }
                        } catch (err: any) {
                            if(err.toString().includes("Couldn't fetch file from URL")){
                                //console.log(SCHEDULE_NAME + ": File for " + meal_id+ " does not exist at " + swosyImageUrl);
                            } else {
                                console.log(err.toString());
                                console.log(SCHEDULE_NAME + ": Error while importing image for meal " + meal_id);
                                console.log(err);
                            }
                        }

                    }
                }

                console.log(SCHEDULE_NAME + ": Processed: " + amountProcessed + "/" + amountMeals+" || Meals without image: " + amountMealsWithoutImage + " | Meals with imported image: " + amountMealsImagesImported);
            }
        }
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

    async findOrCreateMarkingByExternalIdentifier(marking_external_identifier: string) {
        let tablename = TABLENAME_MARKINGS;
        let searchJSON = {
            external_identifier: marking_external_identifier
        };
        let createJSON = {
            alias: marking_external_identifier,
            external_identifier: marking_external_identifier,
        };
        return await ItemsServiceHelper.findOrCreateItemWithApiContext<Markings>(this.apiContext, tablename, searchJSON, createJSON);
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
                await ItemsServiceHelper.updateItemWithApiContext<Canteens>(this.apiContext, TABLENAME_CANTEENS, canteenFoundOrCreated.id, canteen);
            }
        }
    }

    async assignMarkingsToFood(markings: Markings[], food: Foods) {
        let tablename = TABLENAME_MEAL_MARKINGS;
        for (let marking of markings) {
            let food_marking_json = {foods_id: food.id, markings_id: marking.id};
            const searchJSON = food_marking_json;
            const createJSON = food_marking_json;
            await ItemsServiceHelper.findOrCreateItemWithApiContext<FoodsMarkings>(this.apiContext, tablename, searchJSON, createJSON);
        }
    }

    async assignMarkingsToMealOffer(markings: Markings[], foodoffer: Foodoffers) {
        let tablename = TABLENAME_MEALFOFFERS_MARKINGS;
        for (let marking of markings) {
            let foodoffer_marking_json = {foodoffers_id: foodoffer.id, markings_id: marking.id};
            await ItemsServiceHelper.createItemWithApiContext<FoodsMarkings>(this.apiContext, tablename, foodoffer_marking_json);
        }
    }

    async findOrCreateFood(food: FoodWithBasicData): Promise<Foods | undefined> {
        let tablename = TABLENAME_FOODS;
        const searchJSON = {
            id: food.id
        }
        const createJSON = searchJSON
        console.log("["+SCHEDULE_NAME+"]"+" - Find or create food with id: " + food.id);
        return await ItemsServiceHelper.findOrCreateItemWithApiContext<Foods>(this.apiContext, tablename, searchJSON, createJSON);
    }

    async updateFoodBasicFields(food: FoodWithBasicData){
        let tablename = TABLENAME_FOODS;
        return ItemsServiceHelper.updateItemWithApiContext(this.apiContext, tablename, food.id, food);
    }

    async updateFoodTranslations(food: Foods, foodsInformationForParser: FoodsInformationTypeForParser) {
        await TranslationHelper.updateItemTranslations<Foods, FoodsTranslations>(food, foodsInformationForParser.translations, "foods_id", TABLENAME_FOODS, this.apiContext);
    }

    async updateFoods(foodsInformationForParserList: FoodsInformationTypeForParser[]) {
        //let amountOfMeals = foodsInformationForParserList.length;
        let currentFoodIndex = 0;

        foodsInformationForParserList = ListHelper.removeDuplicatesFromJsonListWithSelector(foodsInformationForParserList, (
            foodsInformationForParser: FoodsInformationTypeForParser
        ) => {
            return foodsInformationForParser.basicFoodData.id;
            }
        ); // Remove duplicates https://github.com/rocket-meals/rocket-meals/issues/151

        const amountOfMeals = foodsInformationForParserList.length;
        for (let foodsInformationForParser of foodsInformationForParserList) {
            currentFoodIndex++;

            const basicFoodData = foodsInformationForParser.basicFoodData;
            console.log("["+SCHEDULE_NAME+"]"+" - Update Food " + currentFoodIndex + " / " + amountOfMeals);
            let foundFood = await this.findOrCreateFood(basicFoodData);
            if (!!foundFood && foundFood.id && this.foodParser) {
                console.log("["+SCHEDULE_NAME+"]"+" - Found food with id: " + foundFood.id);

                let marking_external_identifier_list = foodsInformationForParser.marking_external_identifiers;
                let markings = await this.findOrCreateMarkingsByExternalIdentifierList(marking_external_identifier_list);
                console.log("["+SCHEDULE_NAME+"]"+" - Assign markings to food");
                await this.assignMarkingsToFood(markings, foundFood);

                console.log("["+SCHEDULE_NAME+"]"+" - Update basic fields of food");
                await this.updateFoodBasicFields(basicFoodData);

                console.log("["+SCHEDULE_NAME+"]"+" - Update food translations");
                await this.updateFoodTranslations(foundFood, foodsInformationForParser);
            }
        }
    }

    /**
     * As we recieved a new food offer list, we delete all offers that are in the future and newer than the latest date in the list.
     * @param foodofferDatesToDelete
     */
    async deleteAllFoodOffersFromTheEarliestFoodofferDateUpToTheFuture(foodofferDatesToDelete: FoodofferDateType[]) {
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
            await this.deleteAllFoodOffersNewerOrEqualThanDate(oldestFoodofferDate);
        }
    }

    async deleteAllFoodOffersNewerOrEqualThanDate(iso8601StringDate: FoodofferDateType) {
        const directusDateOnlyString = DateHelper.foodofferDateTypeToString(iso8601StringDate)
        console.log("["+SCHEDULE_NAME+"]"+" - Delete food offers newer or equal than date: " + directusDateOnlyString);

        let itemService = await this.itemsServiceCreator.getItemsService<Foodoffers>(TABLENAME_FOODOFFERS)
        //await itemService.deleteByQuery()
        // TODO: Überprüfen ob deleteByQuery funktioniert und ob es dadurch schneller geht bzw. es zu einem Blockieren der Datenbank kommt

        let itemsToDelete = await itemService.readByQuery({
            filter: {
                date: {
                    _gte: directusDateOnlyString
                }
            },
            fields: ['id'], // Assuming 'id' is the primary key field
            limit: -1
        });

        console.log("["+SCHEDULE_NAME+"]"+" - Found " + itemsToDelete.length + " food offers to delete");

        let idsToDelete = itemsToDelete.map(item => item.id);

        // Step 2: Delete the items using their IDs
        if (idsToDelete.length > 0) {
            await itemService.deleteMany(idsToDelete).then(() => {
                console.log(`Food offers deleted successfully for new or equal date: ${directusDateOnlyString} - amount: ${idsToDelete.length}`);
            }).catch(error => {
                console.error(`Error deleting items for new or equal date: ${directusDateOnlyString}:`, error);
            });
        } else {
            console.log(`No food offers found for date: ${directusDateOnlyString} to delete.`);
        }
    }

    async findOrCreateCanteen(canteen: CanteensTypeForParser) {
        let tablename = TABLENAME_CANTEENS;
        let searchJSON = {
            external_identifier: canteen.external_identifier
        }
        let createJSON = canteen
        return await ItemsServiceHelper.findOrCreateItemWithApiContext<Canteens>(this.apiContext, tablename, searchJSON, createJSON);
    }

    async findOrCreateCanteenByExternalIdentifier(external_identifier: string) {
        let searchJSON: CanteensTypeForParser = {
            external_identifier: external_identifier
        }
        return await this.findOrCreateCanteen(searchJSON);
    }


    async createFoodOffer(foodofferForParser: FoodoffersTypeForParser) {
        let tablename = TABLENAME_FOODOFFERS;
        let canteen_external_identifier = foodofferForParser.canteen_external_identifier
        let canteen = await this.findOrCreateCanteenByExternalIdentifier(canteen_external_identifier);
        if (!!canteen) {
            let food_id = foodofferForParser.food_id
            const foodsService = await this.getFoodsService();
            let foodFound = await foodsService.readOne(food_id);
            if (!!foodFound) { // Check if meal exists
                const basicFoodofferData = foodofferForParser.basicFoodofferData;

                if(!basicFoodofferData.alias){ // If alias is not set, try to get it from meal
                    basicFoodofferData.alias = foodFound.alias; // Add alias to meal offer from meal
                }
                let foodOfferToCreate: FoodofferTypeForCreation = {
                    ...foodofferForParser.basicFoodofferData,
                    canteen: canteen.id,
                    food: food_id,
                    date: DateHelper.foodofferDateTypeToString(foodofferForParser.date),
                    date_created: new Date().toISOString(),
                    date_updated: new Date().toISOString()
                }

                let foodoffer_id = await ItemsServiceHelper.createItemWithApiContext<Foodoffers>(this.apiContext, tablename, foodOfferToCreate);
                let foodoffer = await ItemsServiceHelper.readOneItemWithApiContext<Foodoffers>(this.apiContext, tablename, foodoffer_id);

                if (!!foodoffer) {
                    let markings_external_identifiers = foodofferForParser.marking_external_identifiers
                    let markings = await this.findOrCreateMarkingsByExternalIdentifierList(markings_external_identifiers);
                    await this.assignMarkingsToMealOffer(markings, foodoffer);
                }
            }
        }
    }

    async createFoodOffers(foodofferListForParser: FoodoffersTypeForParser[]) {
        let amountOfRawMealOffers = foodofferListForParser.length;
        let currentRawMealOffer = 0;
        console.log("["+SCHEDULE_NAME+"]"+" - Create Food Offers")
        for (let foodofferForParser of foodofferListForParser) {
            currentRawMealOffer++;
            console.log("["+SCHEDULE_NAME+"]"+" - Create Food Offer " + currentRawMealOffer + " / " + amountOfRawMealOffers);
            await this.createFoodOffer(foodofferForParser);
        }
    }

    async updateMarkings(markingsJSONList: MarkingsTypeForParser[]) {
        let tablename = TABLENAME_MARKINGS;
        let itemService = await this.itemsServiceCreator.getItemsService<Markings>(tablename);

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
                let marking_id = await itemService.createOne(markingJSONCopy);
                marking = await itemService.readOne(marking_id);
            } else {
                // If marking exists, update it
                await itemService.updateOne(marking.id, markingJSONCopy);
            }

            if (marking && marking.id) {
                await this.updateMarkingTranslations(marking, markingJSON);
            }
        }
    }


    async updateMarkingTranslations(marking: Markings, markingJSON: MarkingsTypeForParser) {
        await TranslationHelper.updateItemTranslations<Markings, MarkingsTranslations>(marking, markingJSON.translations, "markings_id", TABLENAME_MARKINGS, this.apiContext);
    }

}
