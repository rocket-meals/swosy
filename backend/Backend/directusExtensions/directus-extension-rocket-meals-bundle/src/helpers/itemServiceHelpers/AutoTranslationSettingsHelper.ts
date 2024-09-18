import {AutoTranslationSettings} from "../../databaseTypes/types";
import {ApiContext} from "../ApiContext";
import {ItemsServiceCreator} from "../ItemsServiceCreator";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";

export class AutoTranslationSettingsHelper {

    static TABLENAME = "auto_translation_settings";

    private apiExtensionContext: ApiContext;
    private eventContext: EventContext | undefined;

    constructor(apiExtensionContext: ApiContext, eventContext?: EventContext) {
        this.apiExtensionContext = apiExtensionContext;
        this.eventContext = eventContext;
    }

    async setAutoTranslationSettings(appSettings: Partial<AutoTranslationSettings>) {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext, this.eventContext);
        const itemsService = await itemsServiceCreator.getItemsService<AutoTranslationSettings>(AutoTranslationSettingsHelper.TABLENAME);
        await itemsService.upsertSingleton(appSettings);
        /**
         * await this.database(TABLENAME_FLOWHOOKS).update({
         *             cashregisters_parsing_status: status
         *         });
         */
    }

    async getAppSettings(): Promise<Partial<AutoTranslationSettings> | undefined | null> {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext, this.eventContext);
        const itemsService = await itemsServiceCreator.getItemsService<AutoTranslationSettings>(AutoTranslationSettingsHelper.TABLENAME);
        return await itemsService.readSingleton({});
    }

}
