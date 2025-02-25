import {CollectionNames} from "../CollectionNames";
import {AppSettings} from "../../databaseTypes/types";
import {ApiContext} from "../ApiContext";
import {ItemsServiceCreator} from "../ItemsServiceCreator";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";

export class AppSettingsHelper {

    private apiExtensionContext: ApiContext;
    private eventContext?: EventContext;

    constructor(apiExtensionContext: ApiContext, eventContext?: EventContext) {
        this.apiExtensionContext = apiExtensionContext;
        this.eventContext = eventContext
    }

    async getAppSettings(): Promise<Partial<AppSettings> | undefined | null> {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext);
        const itemsService = await itemsServiceCreator.getItemsService<AppSettings>(CollectionNames.APP_SETTINGS);
        return await itemsService.readSingleton({});
    }

    async getRedirectWhitelist(): Promise<string[] | undefined> {
        let settings = await this.getAppSettings();
        let redirect_whitelist = settings?.redirect_whitelist as string[] | undefined | null;
        if(!redirect_whitelist){
            return undefined;
        }
        return redirect_whitelist;
    }

}
