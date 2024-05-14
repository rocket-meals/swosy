import moment from "moment";
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {ParserInterface} from "./ParserInterface";

const TABLENAME_MEALS = CollectionNames.FOODS;
const TABLENAME_MEAL_MARKINGS = CollectionNames.FOODS_MARKINGS;
const TABLENAME_FOODOFFERS = CollectionNames.FOODOFFERS;
const TABLENAME_CANTEENS = CollectionNames.CANTEENS;
const TABLENAME_MARKINGS = CollectionNames.MARKINGS;
const TABLENAME_MEALFOFFERS_MARKINGS = CollectionNames.FOODOFFER_MARKINGS

const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS;

const SCHEDULE_NAME = "FoodParseSchedule";

export class ParseSchedule {

    private parser: ParserInterface;
    private finished: boolean;
    private schema: any;
    private database: any;
    private logger: any;
    private services: any;
    private itemsServiceCreator: ItemsServiceCreator;
    private itemService: any;

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...
    private foodsService: any;
    private markingsService: any;

    constructor(parser: ParserInterface) {
        this.parser = parser;
        this.finished = true;
    }
    
    // Todo create/generate documentation 

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(services, database, this.schema);
    }

    async setStatus(status) {
        await this.database(TABLENAME_FLOWHOOKS).update({
            foods_parsing_status: status
        });
    }

    async isEnabled() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.foods_parsing_enabled;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getStatus() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.foods_parsing_status;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async parse(force = false) {
        this.foodsService = this.itemsServiceCreator.getItemsService(TABLENAME_MEALS);
        this.markingsService = this.itemsServiceCreator.getItemsService(TABLENAME_MARKINGS);

        let enabled = await this.isEnabled();
        let status = await this.getStatus()
        let statusCheck = "start";
        let statusFinished = "finished";
        let statusRunning = "running";
        let statusFailed = "failed";

        if ((enabled && status === statusCheck && this.finished) || force) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            this.finished = false;
            await this.setStatus(statusRunning);

            try {
                console.log("Create Needed Data");
                await this.parser.createNeededData();

                console.log("Update Canteens")
                let canteensJSONList = await this.parser.getCanteensJSONList() || [];
                await this.updateCanteens(canteensJSONList);

                console.log("Update Markings")
                let markingsJSONList = await this.parser.getMarkingsJSONList() || [];
                await this.updateMarkings(markingsJSONList);

                console.log("Update Foods")
                let foodsJSONList = await this.parser.getMealsJSONList() || [];
                await this.updateFoods(foodsJSONList);

                let rawMealOffersJSONList = await this.parser.getRawMealOffersJSONList() || [];

                console.log("Delete all food offers");
                let ISOStringDatesOfMealOffersToDelete = await this.parser.getMealOffersISOStringDatesToDelete(rawMealOffersJSONList) || [];
                let datesOfMealOffers = this.parseISOStringDatesToDateOnlyDates(ISOStringDatesOfMealOffersToDelete);
                await this.deleteAllFoodOffersWithDates(datesOfMealOffers);

                console.log("Create food offers");
                await this.createFoodOffers(rawMealOffersJSONList);

                console.log("Finished");
                this.finished = true;
                await this.setStatus(statusFinished);
            } catch (err) {
                console.log("[MealParseSchedule] Failed");
                console.log(err);
                this.finished = true;
                await this.setStatus(statusFailed);
            }

        } else if (!this.finished && status !== statusRunning) {
            await this.setStatus(statusRunning);
        }
    }

    parseISOStringDatesToDateOnlyDates(ISOStringDatesList) {
        let listOfDateOnlyDates = [];
        for (let isoDateString of ISOStringDatesList) {
            listOfDateOnlyDates.push(this.parseISOStringDateToDateOnlyDate(isoDateString));
        }
        return listOfDateOnlyDates;
    }

    parseISOStringDateToDateOnlyDate(ISOStringDate) {
        let date = moment(ISOStringDate);
        let dateOnly = date.format("YYYY-MM-DD");
        return new Date(dateOnly); // has to be an dateobject !
    }

    setStatusPublished(json) {
        json["status"] = "published";
        return json;
    }

    async findOrCreateMarking(marking_external_identifier) {
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

    async findOrCreateMarkings(markings_external_identifiers) {
        let markings = [];
        for (let marking_external_identifier of markings_external_identifiers) {
            let marking = await this.findOrCreateMarking(marking_external_identifier);
            if(marking){
                markings.push(marking);
            }
        }
        return markings;
    }

    async createIfNotFound(tablename, searchJson, createJSON = searchJson) {
        //use itemsservice? YES !

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
            console.log("Update Canteen " + currentCanteen + " / " + amountOfCanteens);
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
        //TODO use the "createIfNotFound" method abouve
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
        await this.updateItemTranslations(meal, mealJSON, "meals_id", this.foodsService);
    }


    async updateItemTranslations(item, itemJSON, item_primary_key_in_translation_table, specificItemService) {
        let itemWithTranslations = await specificItemService.readOne(item?.id, {"fields": ["*", "translations.*"]});
        let translationsFromParsing = itemJSON?.translations || {}
        /** translationsFromParsing is an object with the following structure:
         translations: [
         {
                  id: 5166,
                  meals_id: '6',
                  languages_code: 'de-DE',
                  name: 'Hallo mein Name ist'
                },
         {
                  id: 5167,
                  meals_id: '6',
                  languages_code: 'en-US',
                  name: 'Hi my name is'
                }
         ]
         */
        let remaining_translationsFromParsing = JSON.parse(JSON.stringify(translationsFromParsing)); //make a work copy
        /** remaining_translationsFromParsing is an object with the following structure:
         {
                "de-DE": {name ....},
                "en-US": {....}
            }
         */
        let createTranslations = [];
        let updateTranslations = [];
        let deleteTranslations = [];

        if (!!itemWithTranslations) {
            let existingTranslations = itemWithTranslations?.translations || [];


            let existingTranslationsDifferentFromParsing = false;
            let newTranslationsFromParsing = false;

            for (let existingTranslation of existingTranslations) { //check all existing translations
                let existingLanguageCode = existingTranslation?.languages_code;
                let translationFromParsing = translationsFromParsing[existingLanguageCode];
                if (!!translationFromParsing) { //we also got a translation from the parse
                    /* Update translation */
                    translationFromParsing = JSON.parse(JSON.stringify(translationFromParsing)); //make a copy
                    delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language

                    if (existingTranslation?.name !== translationFromParsing?.name) {
                        existingTranslationsDifferentFromParsing = true;
                        updateTranslations.push({
                            id: existingTranslation?.id,
                            ...translationFromParsing,
                            "languages_code": {"code": existingLanguageCode}
                        });
                        //console.log("existingTranslation is different from parsing")
                    } else {
                        //translation is the same, do nothing
                        //console.log("translation is the same, do nothing")
                    }
                } else { //the parser dont provide a translation, we should delete it?
                    //TODO check if translation was generated or manually typed
                    delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language
                }
            }
            //check remaining translationsFromParsing, then put into createTranslations
            let remaining_languageKeys = Object.keys(remaining_translationsFromParsing);
            for (let i = 0; i < remaining_languageKeys?.length; i++) {
                let remaining_languageKey = remaining_languageKeys[i];
                let translationFromParsing = translationsFromParsing[remaining_languageKey];
                if(!!translationFromParsing){
                    newTranslationsFromParsing = true;
                    createTranslations.push({
                        [item_primary_key_in_translation_table]: item?.id,
                        ...translationFromParsing,
                        "languages_code": {"code": remaining_languageKey}
                    });
                }
            }

            let updateObject = {
                "translations": {
                    "create": createTranslations,
                    "update": updateTranslations,
                    "delete": deleteTranslations
                }
            };

            console.log("Update Translations: create (" + createTranslations.length + "), update (" + updateTranslations.length + "), delete (" + deleteTranslations.length + ")");
            let updateNeeded = existingTranslationsDifferentFromParsing || newTranslationsFromParsing;
            if(updateNeeded){
                //console.log(JSON.stringify(updateObject, null, 2));
                await specificItemService.updateOne(item?.id, {id: item?.id, ...updateObject});
            }
        }
    }

    async updateFoods(mealsJSONList) {
        let amountOfMeals = mealsJSONList.length;
        let currentMeal = 0;
        for (let mealJSON of mealsJSONList) {
            currentMeal++;
            console.log("Update Food " + currentMeal + " / " + amountOfMeals);
            let meal = await this.findOrCreateFood(mealJSON);
            if (!!meal && meal.id) {
                let markingLabelsList = await this.parser.getMarkingLabelsForMealJSON(mealJSON) || [];
                let markings = await this.findOrCreateMarkings(markingLabelsList);
                await this.assignMarkingsToFood(markings, meal);

                let nutritionsJSON = await this.parser.getMealNutritionsForMealJSON(mealJSON);
                if (!!nutritionsJSON) {
                    await this.assignNutritionsToFood(meal, nutritionsJSON);
                }

                await this.updateFoodTranslations(meal, mealJSON);
            }
        }
    }

    async deleteAllFoodOffersWithDates(datesOfMealOffers) {
        let itemService = this.itemsServiceCreator.getItemsService(TABLENAME_FOODOFFERS)
        for (let date of datesOfMealOffers) {
            // Step 1: Retrieve IDs of items to delete for the specific date
            let itemsToDelete = await itemService.readByQuery({
                filter: {
                    date: date
                },
                fields: ['id'], // Assuming 'id' is the primary key field
                limit: -1
            });

            let idsToDelete = itemsToDelete.map(item => item.id);

            // Step 2: Delete the items using their IDs
            if (idsToDelete.length > 0) {
                await itemService.deleteMany(idsToDelete).then(() => {
                    console.log(`Items deleted successfully for date: ${date}`);
                }).catch(error => {
                    console.error(`Error deleting items for date: ${date}:`, error);
                });
            }
        }
    }

    async findOrCreateCanteen(external_identifier) {
        console.log("Find or create canteen: " + external_identifier)

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
            console.log("No canteen found, creating a new one")
            canteenJSON = this.setStatusPublished(canteenJSON);
            let createdCanteen_id = await itemService.createOne(canteenJSON);
            canteen = await itemService.readOne(createdCanteen_id);
        } else {
            console.log("Canteen found")
        }

        return canteen;
    }


    async createFoodOffer(rawFoodOffer) {
        let tablename = TABLENAME_FOODOFFERS;
        let canteenLabel = await this.parser.getCanteenLabelFromRawMealOffer(rawFoodOffer);
        if (!!canteenLabel) {
            let canteen = await this.findOrCreateCanteen(canteenLabel);
            if (!!canteen) {
                let food_id = await this.parser.getMealIdFromRawMealOffer(rawFoodOffer);
                let mealFromService = await this.foodsService.readByQuery({
                    filter: {
                        id: food_id
                    }
                });
                if (!!mealFromService && mealFromService.length > 0) {
                    let isoDateStringOfMealOffer = await this.parser.getISODateStringOfMealOffer(rawFoodOffer)
                    //console.log("get alias for meal offer")
                    //console.log(this.parser)
                    let alias = await this.parser.getAliasForMealOfferFromRawMealOffer(rawFoodOffer);
                    let date = this.parseISOStringDateToDateOnlyDate(isoDateStringOfMealOffer);
                    if (!!food_id && !!date) {
                        let foodOfferJSON = {
                            food: food_id,
                            alias: alias,
                            canteen: canteen.id,
                            date: date,
                            price_student: await this.parser.getPriceForGroupFromRawMealOffer("student", rawFoodOffer) || null,
                            price_employee: await this.parser.getPriceForGroupFromRawMealOffer("employee", rawFoodOffer) || null,
                            price_guest: await this.parser.getPriceForGroupFromRawMealOffer("guest", rawFoodOffer) || null,
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
                            let markings_external_identifiers = await this.parser.getMarkingsExternalIdentifiersFromRawMealOffer(rawFoodOffer) || [];
                            let markings = await this.findOrCreateMarkings(markings_external_identifiers);
                            await this.assignMarkingsToMealOffer(markings, mealoffer);
                        }
                        let nutritionsJSON = await this.parser.getMealNutritionsForRawMealOffer(rawFoodOffer);
                        if (!!nutritionsJSON) {
                            await this.assignNutritionsToFoodOffer(mealoffer, nutritionsJSON);
                        }
                    }
                }
            }
        }
    }

    async createFoodOffers(rawMealOffers) {
        let amountOfRawMealOffers = rawMealOffers.length;
        let currentRawMealOffer = 0;
        for (let rawMealOffer of rawMealOffers) {
            currentRawMealOffer++;
            console.log("Create Food Offer " + currentRawMealOffer + " / " + amountOfRawMealOffers);
            await this.createFoodOffer(rawMealOffer);
        }
    }

    async updateMarkings(markingsJSONList) {
        let tablename = TABLENAME_MARKINGS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename);

        let amountOfMarkings = markingsJSONList.length;
        let currentMarking = 0;
        for (let markingJSON of markingsJSONList) {
            currentMarking++;
            console.log("Update Marking " + currentMarking + " / " + amountOfMarkings);

            let markingJSONCopy = JSON.parse(JSON.stringify(markingJSON));
            delete markingJSONCopy.translations; // Remove meals translations, add it later

            let json = { external_identifier: markingJSONCopy.external_identifier };
            let markings = await itemService.readByQuery({
                filter: json,
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
        await this.updateItemTranslations(marking, markingJSON, "markings_id", this.markingsService);
    }

}
