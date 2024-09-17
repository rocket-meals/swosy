import {AutoTranslationSettings} from "../../databaseTypes/types";
import {ApiContext} from "../ApiContext";
import {ItemsServiceCreator} from "../ItemsServiceCreator";

export class AutoTranslationSettingsHelper {

    static TABLENAME = "auto_translation_settings";

    private apiExtensionContext: ApiContext;

    constructor(apiExtensionContext: ApiContext) {
        this.apiExtensionContext = apiExtensionContext;
    }

    async setAutoTranslationSettings(appSettings: Partial<AutoTranslationSettings>) {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext);
        const itemsService = await itemsServiceCreator.getItemsService<AutoTranslationSettings>(AutoTranslationSettingsHelper.TABLENAME);
        await itemsService.upsertSingleton(appSettings);
        /**
         * await this.database(TABLENAME_FLOWHOOKS).update({
         *             cashregisters_parsing_status: status
         *         });
         */
    }

    async getAppSettings(): Promise<Partial<AutoTranslationSettings> | undefined | null> {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext);
        const itemsService = await itemsServiceCreator.getItemsService<AutoTranslationSettings>(AutoTranslationSettingsHelper.TABLENAME);
        return await itemsService.readSingleton({});
    }

}
