import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {WashingmachineParserInterface} from "./WashingmachineParserInterface";
import {SCHEDULE_NAME_WASHING_MACHINE} from "./index";
import {ApiContext} from "../helpers/ApiContext";

const TABLENAME_APARTMENTS = CollectionNames.WASHINGMACHINES;
const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS;

const SCHEDULE_NAME = "WashingmachineParseSchedule";

export class WashingmachineParseSchedule {

    parser: WashingmachineParserInterface | undefined;
    private finished: boolean;
    private schema: any;
    private database: any;
    private logger: any;
    private services: any;
    private itemsServiceCreator: ItemsServiceCreator;
    private itemService: any;
    private apiContext: ApiContext;

    constructor(apiContext: ApiContext, parser?: WashingmachineParserInterface) {
        this.apiContext = apiContext
        this.parser = parser
        this.finished = true;
    }

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
    }

    async setStatus(status) {
        await this.database(TABLENAME_FLOWHOOKS).update({
            housing_parsing_status: status
        });
    }

    async isEnabled() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.housing_parsing_enabled;
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
                return flows?.housing_parsing_status;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async parse() {
        if(!this.parser){
            console.log(SCHEDULE_NAME_WASHING_MACHINE+": No parser set");
            return
        }

        return;

        this.itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_APARTMENTS);

        let enabled = await this.isEnabled();
        let status = await this.getStatus()
        let statusCheck = "start";
        let statusFinished = "finished";
        let statusRunning = "running";
        let statusFailed = "failed";

        console.log("housing-sync-hook: parse: enabled: " + enabled + " status: " + status);

        if (enabled && status === statusCheck && this.finished) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            this.finished = false;
            await this.setStatus(statusRunning);

            try {
                //let apartmentsJSONList = await this.parser.getJSONList();
                //await this.updateApartments(apartmentsJSONList);

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

    setStatusPublished(json) {
        json["status"] = "published";
        return json;
    }

    async findOrCreateApartment(newsJSON) {
        console.log("Make copy of");
        console.log(newsJSON);
        let copyNewsJSON = JSON.parse(JSON.stringify(newsJSON))
        let tablename = TABLENAME_APARTMENTS
        let itemService = await this.itemsServiceCreator.getItemsService(tablename);
        let items = await itemService.readByQuery({
            filter: {external_identifier: copyNewsJSON?.external_identifier}
        });
        let item = items[0]

        if (!item) {
            delete copyNewsJSON.translations; //remove meals translations, we need to add it later
            let itemId = await itemService.createOne(copyNewsJSON);
            item = await itemService.readOne(itemId, {"fields": ["*", "translations.*"]});
        }
        return item;
    }

    async updateApartmentTranslations(resource, resourceJSON) {
        await this.updateItemTranslations(resource, resourceJSON, "news_id", this.itemService);
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
                [TranslationHelper.]: {name ....},
                [TranslationHelper.]: {....}
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
                        console.log("existingTranslation is different from parsing")
                    } else {
                        //translation is the same, do nothing
                        console.log("translation is the same, do nothing")
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

            let updateNeeded = existingTranslationsDifferentFromParsing || newTranslationsFromParsing;
            if(updateNeeded){
                //console.log(JSON.stringify(updateObject, null, 2));
                await specificItemService.updateOne(item?.id, {id: item?.id, ...updateObject});
            }
        }
    }

    async updateApartments(resourceJSONList) {
        for (let resourceJSON of resourceJSONList) {
            let resource = await this.findOrCreateApartment(resourceJSON);
            if (!!resource && resource?.id) {
                await this.updateApartmentTranslations(resource, resourceJSON);
            }
        }
    }

}
