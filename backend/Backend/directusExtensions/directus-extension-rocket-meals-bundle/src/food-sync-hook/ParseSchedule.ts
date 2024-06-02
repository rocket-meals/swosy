import hash from 'object-hash';
import {FileServiceCreator, ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {FoodParserInterface} from "./FoodParserInterface";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {MarkingParserInterface} from "./MarkingParserInterface";
import {AppSettingsHelper} from "../helpers/AppSettingsHelper";
import {SWOSY_API_Parser} from "./SWOSY_API_Parser";
import {PriceGroups} from "./PriceGroups";

const TABLENAME_MEALS = CollectionNames.FOODS;
const TABLENAME_MEAL_MARKINGS = CollectionNames.FOODS_MARKINGS;
const TABLENAME_FOODOFFERS = CollectionNames.FOODOFFERS;
const TABLENAME_CANTEENS = CollectionNames.CANTEENS;
const TABLENAME_MARKINGS = CollectionNames.MARKINGS;
const TABLENAME_MEALFOFFERS_MARKINGS = CollectionNames.FOODOFFER_MARKINGS

const FIELD_FOODS_ID = "id";

const SCHEDULE_NAME = "FoodParseSchedule";

export class ParseSchedule {

    private foodParser: FoodParserInterface | null
    private markingParser: MarkingParserInterface | null;
    //private previousMealOffersHash: string | null; // in multi instance environment this should be a field in the database
    //private finished: boolean; // in multi instance environment this should be a field in the database
    private schema: any;
    private database: any;
    private logger: any;
    private services: any;
    private env: any;
    private itemsServiceCreator: ItemsServiceCreator;

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...
    private foodsService: any;
    private markingsService: any;

    constructor(foodParser: FoodParserInterface | null, markingParser: MarkingParserInterface | null) {
        this.foodParser = foodParser;
        this.markingParser = markingParser;
    }
    
    // Todo create/generate documentation 

    async init(getSchema, services, database, logger, env) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.env = env;
        this.itemsServiceCreator = new ItemsServiceCreator(services, database, this.schema);
    }

    async setStatus(status: string) {
        await AppSettingsHelper.setAppSettings(this.itemsServiceCreator, {
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS]: status,
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_LAST_RUN]: new Date()
        });
    }

    async isEnabled() {
        try {
            let currentAppSettings = await AppSettingsHelper.readAppSettings(this.itemsServiceCreator);
            return currentAppSettings[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_ENABLED];
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getStatus() {
        try {
            let currentAppSettings = await AppSettingsHelper.readAppSettings(this.itemsServiceCreator);
            return currentAppSettings[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_STATUS];
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getHashOfJsonObject(object: any) {
        return hash(object, {
            algorithm: 'md5',
            excludeValues: false,
            ignoreUnknown: false
        });
    }

    async parse(force = false) {
        this.foodsService = this.itemsServiceCreator.getItemsService(TABLENAME_MEALS);
        this.markingsService = this.itemsServiceCreator.getItemsService(TABLENAME_MARKINGS);

        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        if ((enabled && status === AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_START) || force) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_RUNNING);

            try {
                if(!!this.markingParser){
                    console.log("["+SCHEDULE_NAME+"]"+" - Create Needed Data for MarkingParser");
                    await this.markingParser.createNeededData()
                    console.log("["+SCHEDULE_NAME+"]"+" - Update Markings")
                    let markingsJSONList = await this.markingParser.getMarkingsJSONList() || [];
                    await this.updateMarkings(markingsJSONList);
                }

                if(!!this.foodParser){
                    console.log("["+SCHEDULE_NAME+"]"+" - Create Needed Data for FoodParser");
                    await this.foodParser.createNeededData()

                    console.log("["+SCHEDULE_NAME+"]"+" - Update Canteens")
                    let canteensJSONList = await this.foodParser.getCanteensJSONList() || [];
                    // TODO also check if previous values changed or not using hash
                    await this.updateCanteens(canteensJSONList);


                    console.log("["+SCHEDULE_NAME+"]"+" - Update Foods")
                    let foodsJSONList = await this.foodParser.getMealsJSONList() || [];
                    // TODO also check if previous values changed or not using hash
                    await this.updateFoods(foodsJSONList);

                    let rawMealOffersJSONList = await this.foodParser.getRawMealOffersJSONList() || [];

                    console.log("["+SCHEDULE_NAME+"]"+" - Check if meal offers changed")
                    let currentMealOffersHash = await this.getHashOfJsonObject(rawMealOffersJSONList);
                    console.log("["+SCHEDULE_NAME+"]"+" - Current meal offers hash: " + currentMealOffersHash);
                    let currentAppSettings = await AppSettingsHelper.readAppSettings(this.itemsServiceCreator)
                    let previousMealOffersHash = currentAppSettings[AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_HASH];

                    // TODO: At the start of the server all food offers get deleted and created again. While this is okay, it would be nicer to check if there are realy new data and only to update/create these instead of recreating all offers new when a single thing changes due to our changed hash.
                    const mealOffersChanged = !previousMealOffersHash || previousMealOffersHash !== currentMealOffersHash;
                    if(mealOffersChanged){
                        console.log("["+SCHEDULE_NAME+"]"+" - Delete all food offers");
                        let ISOStringDatesOfMealOffersToDelete = await this.getIsoDatesFromRawMealOfferJSONList(rawMealOffersJSONList, this.foodParser);
                        let listIso8601StringDates = this.formatIsoStringDatesToIso8601WithoutTimezone(ISOStringDatesOfMealOffersToDelete);
                        await this.deleteAllFoodOffersWithDates(listIso8601StringDates);

                        console.log("["+SCHEDULE_NAME+"]"+" - Create food offers");
                        await this.createFoodOffers(rawMealOffersJSONList, this.foodParser);


                        console.log("["+SCHEDULE_NAME+"]"+" - Set previous meal offers hash");
                        await AppSettingsHelper.setAppSettings(this.itemsServiceCreator, {
                            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_HASH]: currentMealOffersHash
                        });
                    }
                }

                await this.reimportImages();

                console.log("["+SCHEDULE_NAME+"]"+" - Finished");
                await this.setStatus(AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FINISHED);
            } catch (err) {
                console.log("["+SCHEDULE_NAME+"]"+" - Failed");
                console.log(err);
                await this.setStatus(AppSettingsHelper.VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FAILED);
            }
        }
    }

    async reimportImages() {
        // TODO: Remove this after switched to new project
        console.log("["+SCHEDULE_NAME+"]"+" - Check for image synchronize");
        console.log("["+SCHEDULE_NAME+"]"+" - -- TODO: Remove this after switched to new project --");
        try{
            await this.checkForImageSynchronize(this.env, this.services, this.database, this.schema);
        } catch (err) {
            console.log("["+SCHEDULE_NAME+"]"+" - Error while checking for image synchronize");
            console.log(err);
        }
    }

    async checkForImageSynchronize(env: any, services: any, database: any, schema: any){
        //console.log(SCHEDULE_NAME + ": Checking for image synchronize");
        const FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY = env.FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY;
        const FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL = env.FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL;

        const itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
        const fileServiceCreator = new FileServiceCreator(services, database, schema);

        const canImportImages = FOOD_IMAGE_SYNC_ON_STARTUP_FROM_SWOSY && FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL;
        if(canImportImages){
            console.log(SCHEDULE_NAME + ": Importing images from a SWOSY API: " + FOOD_IMAGE_SYNC_SWOSY_API_SERVER_URL);
            const foodsService = itemsServiceCreator.getItemsService(CollectionNames.FOODS);
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

    async getIsoDatesFromRawMealOfferJSONList(rawMealOfferJSONList, foodParser: FoodParserInterface) {
        let isoDatesStringDict: { [key: string]: string } = {};
        for (let rawFoodOffer of rawMealOfferJSONList) {
            let isoDateStringOfMealOffer = await foodParser.getISODateStringOfMealOffer(rawFoodOffer)
            isoDatesStringDict[isoDateStringOfMealOffer] = isoDateStringOfMealOffer;
        }
        let isoDatesStringList = Object.keys(isoDatesStringDict);
        return isoDatesStringList;
    }

    formatIsoStringDatesToIso8601WithoutTimezone(ISOStringDatesList: string[]) {
        let listOfDateOnlyDates = [];
        for (let isoDateString of ISOStringDatesList) {
            let date = new Date(isoDateString);
            listOfDateOnlyDates.push(this.formatDateToIso8601WithoutTimezone(date));
        }
        return listOfDateOnlyDates;
    }

    formatDateToIso8601WithoutTimezone(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = '00';
        const minutes = '00';
        const seconds = '00';

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    setStatusPublished(json) {
        json["status"] = "published";
        return json;
    }

    async findOrCreateMarkingByExternalIdentifier(marking_external_identifier) {
        let tablename = TABLENAME_MARKINGS;
        let searchJSON = {
            external_identifier: marking_external_identifier
        };
        let markingJSON = {
            alias: marking_external_identifier,
            external_identifier: marking_external_identifier,
        };
        markingJSON = this.setStatusPublished(markingJSON);
        let marking = await this.createIfNotFound(tablename, searchJSON, markingJSON);
        return marking;
    }

    async findOrCreateMarkingsByExternalIdentifierList(markings_external_identifiers) {
        let markings = [];
        for (let marking_external_identifier of markings_external_identifiers) {
            let marking = await this.findOrCreateMarkingByExternalIdentifier(marking_external_identifier);
            if(marking){
                markings.push(marking);
            }
        }
        return markings;
    }

    async createIfNotFound(tablename, searchJson, createJSON = searchJson) {
        let itemService = this.itemsServiceCreator.getItemsService(tablename);

        let items = await itemService.readByQuery({
            filter: searchJson
        })
        let item = items[0]
        if (!item) {
            await itemService.createOne(createJSON)
            let items = await itemService.readByQuery({
                filter: searchJson
            })
            item = items[0]
        }
        return item;
    }

    async updateCanteens(canteenJSONList) {
        let amountOfCanteens = canteenJSONList.length;
        let currentCanteen = 0;
        for (let canteenJSON of canteenJSONList) {
            currentCanteen++;
            console.log("["+SCHEDULE_NAME+"]"+" - Update Canteen " + currentCanteen + " / " + amountOfCanteens);
            let canteen = await this.findOrCreateCanteen(canteenJSON.external_identifier);
        }
    }

    async assignMarkingsToFood(markings, food) {
        let tablename = TABLENAME_MEAL_MARKINGS;
        for (let marking of markings) {
            let food_marking_json = {foods_id: food.id, markings_id: marking.id};
            await this.createIfNotFound(tablename, food_marking_json, food_marking_json);
        }
    }

    async assignMarkingsToMealOffer(markings, foodoffer) {
        let tablename = TABLENAME_MEALFOFFERS_MARKINGS;
        for (let marking of markings) {
            let foodoffer_marking_json = {foodoffers_id: foodoffer.id, markings_id: marking.id};
            await this.createIfNotFound(tablename, foodoffer_marking_json, foodoffer_marking_json);
        }
    }

    async assignNutritionsToFoodOffer(foodoffer, nutritionsJSON) {
        let tablename = TABLENAME_FOODOFFERS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename)
        await itemService.updateOne(foodoffer.id, nutritionsJSON);
    }

    async assignNutritionsToFood(food, nutritionsJSON) {
        let tablename = TABLENAME_MEALS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename)
        await itemService.updateOne(food.id, nutritionsJSON);
    }

    async findOrCreateFood(mealJSON) {
        let mealJSONCopy = JSON.parse(JSON.stringify(mealJSON));
        //TODO use the "createIfNotFound" method above
        delete mealJSONCopy.translations; //remove meals translations, we need to add it later
        let tablename = TABLENAME_MEALS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename)
        let meals = await itemService.readByQuery({filter: {id: mealJSONCopy.id}});
        let meal = meals[0]
        if (!meal) {
            mealJSON = this.setStatusPublished(mealJSONCopy);
            await itemService.createOne(mealJSONCopy)

        }
        meals = await itemService.readByQuery({filter: {id: mealJSONCopy.id}});
        meal = meals[0]
        return meal;
    }

    async updateFoodTranslations(meal, mealJSON) {
        await TranslationHelper.updateItemTranslations(meal, mealJSON, "foods_id", this.foodsService);
    }


    removeDuplicatesFromJsonList(jsonList: any[], key: string, collection_name?: string) {
        let valueList: any = [];
        let keyDict: any = {};

        for (let json of jsonList) {
            let keyValue = json[key];
            const savedValue = keyDict[keyValue];
            if(!savedValue){
                keyDict[keyValue] = json;
                valueList.push(json);
            } else {
                // Duplicate found - ignore it
            }
        }

        return valueList;
    }

    async updateFoods(foodsJSONList) {
        let amountOfMeals = foodsJSONList.length;
        let currentFoodIndex = 0;


        foodsJSONList = this.removeDuplicatesFromJsonList(foodsJSONList, FIELD_FOODS_ID, "foods"); // Remove duplicates https://github.com/rocket-meals/rocket-meals/issues/151

        for (let foodJSON of foodsJSONList) {
            currentFoodIndex++;
            //console.log("["+SCHEDULE_NAME+"]"+" - Update Food " + currentFoodIndex + " / " + amountOfMeals);
            let food = await this.findOrCreateFood(foodJSON);
            if (!!food && food.id && this.foodParser) {
                let marking_external_identifier_list = await this.foodParser.getMarkingExternalIdentifierListForFoodJSON(foodJSON) || [];
                let markings = await this.findOrCreateMarkingsByExternalIdentifierList(marking_external_identifier_list);
                await this.assignMarkingsToFood(markings, food);

                let nutritionsJSON = await this.foodParser.getMealNutritionsForMealJSON(foodJSON);
                if (!!nutritionsJSON) {
                    await this.assignNutritionsToFood(food, nutritionsJSON);
                }

                let tablename = TABLENAME_MEALS;
                let itemService = this.itemsServiceCreator.getItemsService(tablename)
                //console.log("["+SCHEDULE_NAME+"]"+" - Update Food with alias (and category): " + foodJSON.alias + " (" + foodJSON.category + ")");
                await itemService.updateOne(food.id, {
                    alias: foodJSON.alias,
                    category: foodJSON.category,
                });


                await this.updateFoodTranslations(food, foodJSON);
            }
        }
    }

    async deleteAllFoodOffersWithDates(listIso8601StringDates: string[]) {
        let itemService = this.itemsServiceCreator.getItemsService(TABLENAME_FOODOFFERS)
        for (let iso8601StringDate of listIso8601StringDates) {
            // Step 1: Retrieve IDs of items to delete for the specific date
            console.log("["+SCHEDULE_NAME+"]"+" - Deleting food offers for date: " + iso8601StringDate);

            let itemsToDelete = await itemService.readByQuery({
                filter: {
                    date: iso8601StringDate
                },
                fields: ['id'], // Assuming 'id' is the primary key field
                limit: -1
            });

            let idsToDelete = itemsToDelete.map(item => item.id);

            // Step 2: Delete the items using their IDs
            if (idsToDelete.length > 0) {
                await itemService.deleteMany(idsToDelete).then(() => {
                    console.log(`Food offers deleted successfully for date: ${iso8601StringDate} - amount: ${idsToDelete.length}`);
                }).catch(error => {
                    console.error(`Error deleting items for date: ${iso8601StringDate}:`, error);
                });
            } else {
                console.log(`No food offers found for date: ${iso8601StringDate} to delete.`);
            }
        }
    }

    async findOrCreateCanteen(external_identifier) {
        //console.log("["+SCHEDULE_NAME+"]"+" - Find or create canteen: " + external_identifier)

        let tablename = TABLENAME_CANTEENS;
        let canteenJSON = {
            alias: external_identifier,
            external_identifier: external_identifier
        };

        let itemService = this.itemsServiceCreator.getItemsService(tablename);

        // Step 1: Try to find the canteen by its external identifier
        let canteens = await itemService.readByQuery({
            filter: {
                external_identifier: canteenJSON.external_identifier
            },
            limit: 1
        });

        let canteen = canteens.length > 0 ? canteens[0] : null;

        // Step 2: If canteen doesn't exist, create a new one
        if (!canteen) {
            console.log("["+SCHEDULE_NAME+"]"+" - Canteen "+canteenJSON.alias+" not found, creating a new one.");
            canteenJSON = this.setStatusPublished(canteenJSON);
            let createdCanteen_id = await itemService.createOne(canteenJSON);
            canteen = await itemService.readOne(createdCanteen_id);
        } else {
            //console.log("["+SCHEDULE_NAME+"]"+" - Canteen found")
        }

        return canteen;
    }


    async createFoodOffer(rawFoodOffer, foodParser: FoodParserInterface) {
        let tablename = TABLENAME_FOODOFFERS;
        let canteenLabel = await foodParser.getCanteenLabelFromRawMealOffer(rawFoodOffer);
        if (!!canteenLabel) {
            let canteen = await this.findOrCreateCanteen(canteenLabel);
            if (!!canteen) {
                let food_id = await foodParser.getMealIdFromRawMealOffer(rawFoodOffer);
                let mealFromServiceByReadOne = await this.foodsService.readOne(food_id);
                if (!!mealFromServiceByReadOne) { // Check if meal exists
                    let isoDateStringOfMealOffer = await foodParser.getISODateStringOfMealOffer(rawFoodOffer)
                    //console.log("["+SCHEDULE_NAME+"]"+" - get alias for meal offer")
                    //console.log(this.parser)
                    let alias = await foodParser.getAliasForMealOfferFromRawMealOffer(rawFoodOffer);
                    let date = this.formatDateToIso8601WithoutTimezone(new Date(isoDateStringOfMealOffer));
                    if (!!food_id && !!date) {
                        let foodOfferJSON = {
                            food: food_id,
                            alias: alias,
                            canteen: canteen.id,
                            date: date,
                            price_student: await foodParser.getPriceForGroupFromRawMealOffer(PriceGroups.PRICE_GROUP_STUDENT, rawFoodOffer) || null,
                            price_employee: await foodParser.getPriceForGroupFromRawMealOffer(PriceGroups.PRICE_GROUP_EMPLOYEE, rawFoodOffer) || null,
                            price_guest: await foodParser.getPriceForGroupFromRawMealOffer(PriceGroups.PRICE_GROUP_GUEST, rawFoodOffer) || null,
                            date_updated: new Date(),
                            date_created: new Date(),
                        };
                        foodOfferJSON = this.setStatusPublished(foodOfferJSON);
                        let mealofferService = this.itemsServiceCreator.getItemsService(tablename);

                        // Create a new meal offer using the ItemsService
                        let createdMealoffer_id = await mealofferService.createOne(foodOfferJSON);

                        // Fetch the newly created meal offer
                        // You can use readOne if you just need to fetch the created item by its ID
                        let mealoffer = await mealofferService.readOne(createdMealoffer_id);

                        if (!!mealoffer) {
                            let markings_external_identifiers = await foodParser.getMarkingsExternalIdentifiersFromRawMealOffer(rawFoodOffer) || [];
                            let markings = await this.findOrCreateMarkingsByExternalIdentifierList(markings_external_identifiers);
                            await this.assignMarkingsToMealOffer(markings, mealoffer);
                        }
                        let nutritionsJSON = await foodParser.getMealNutritionsForRawMealOffer(rawFoodOffer);
                        if (!!nutritionsJSON) {
                            await this.assignNutritionsToFoodOffer(mealoffer, nutritionsJSON);
                        }
                    }
                }
            }
        }
    }

    async createFoodOffers(rawMealOffers, foodParser: FoodParserInterface) {
        let amountOfRawMealOffers = rawMealOffers.length;
        let currentRawMealOffer = 0;
        console.log("["+SCHEDULE_NAME+"]"+" - Create Food Offers")
        for (let rawMealOffer of rawMealOffers) {
            currentRawMealOffer++;
            console.log("["+SCHEDULE_NAME+"]"+" - Create Food Offer " + currentRawMealOffer + " / " + amountOfRawMealOffers);
            await this.createFoodOffer(rawMealOffer, foodParser);
        }
    }

    async updateMarkings(markingsJSONList) {
        let tablename = TABLENAME_MARKINGS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename);

        markingsJSONList = this.removeDuplicatesFromJsonList(markingsJSONList, "external_identifier", "markings");// Remove duplicates https://github.com/rocket-meals/rocket-meals/issues/151

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
                marking_id = await itemService.readOne(marking_id);
            } else {
                // If marking exists, update it
                await itemService.updateOne(marking.id, markingJSONCopy);
            }

            if (marking && marking.id) {
                await this.updateMarkingTranslations(marking, markingJSON);
            }
        }
    }


    async updateMarkingTranslations(marking, markingJSON) {
        await TranslationHelper.updateItemTranslations(marking, markingJSON, "markings_id", this.markingsService);
    }

}
