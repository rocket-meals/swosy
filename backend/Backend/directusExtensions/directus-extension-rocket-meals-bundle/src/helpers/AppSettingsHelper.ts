import moment from "moment";
import hash from 'object-hash';
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {FoodParserInterface} from "./FoodParserInterface";
import {TranslationHelper} from "../helpers/TranslationHelper";
import {MarkingParserInterface} from "./MarkingParserInterface";



export class AppSettingsHelper {

    static FIELD_APP_SETTINGS_FOODS_PARSING_ENABLED = "foods_parsing_enabled";
    static FIELD_APP_SETTINGS_FOODS_PARSING_STATUS = "foods_parsing_status";
    static FIELD_APP_SETTINGS_FOODS_PARSING_HASH = "foods_parsing_hash";
    static FIELD_APP_SETTINGS_FOODS_PARSING_LAST_RUN = "foods_parsing_last_date";
    static VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_START = "start";
    static VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_RUNNING = "running";
    static VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FINISHED = "finished";
    static VALUE_APP_SETTINGS_FOODS_PARSING_STATUS_FAILED = "failed";

    static async readAppSettings(itemsServiceCreator: ItemsServiceCreator){
        let appSettingsService = itemsServiceCreator.getItemsService(CollectionNames.APP_SETTINGS);
        let appSettings = await appSettingsService.readSingleton({});
        return appSettings;
    }

    static async setAppSettings(itemsServiceCreator: ItemsServiceCreator, appSettings: any){
        let appSettingsService = itemsServiceCreator.getItemsService(CollectionNames.APP_SETTINGS);
        return await appSettingsService.upsertSingleton(appSettings);
    }
}