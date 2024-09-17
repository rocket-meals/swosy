import {ApiContext} from "../helpers/ApiContext";
import {EnvVariableHelper} from "../helpers/EnvVariableHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {AutoTranslationSettingsHelper} from "../helpers/itemServiceHelpers/AutoTranslationSettingsHelper";

export class TranslatorSettings {

    private apiKey: null | string;
    private translationSettingsService: AutoTranslationSettingsHelper;
    private apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
        this.apiKey = null; // To hold the API key in memory
        this.apiKey = EnvVariableHelper.getAutoTranslateApiKey();
        const myDatabaseHelper = new MyDatabaseHelper(this.apiContext);
        this.translationSettingsService = myDatabaseHelper.getAutoTranslationSettingsHelper();
    }

    async getSettings() {
        return await this.translationSettingsService.getAppSettings();
    }

    async isAutoTranslationEnabled() {
        let settings = await this.getSettings();
        return settings?.active;
    }

    async setSettings(newSettings: any) {
        await this.translationSettingsService.setAutoTranslationSettings(newSettings);
    }

    async getAuthKey() {
        return this.apiKey;
    }

}
