import {CollectionNames} from "./CollectionNames";
import {AppSettings} from "../databaseTypes/types";
import {ApiContext} from "./ApiContext";

export type FlowStatusType = "start" | "finished" | "running" | "failed";
export class FlowStatus {
    static readonly START: FlowStatusType = "start";
    static readonly FINISHED: FlowStatusType = "finished";
    static readonly RUNNING: FlowStatusType = "running";
    static readonly FAILED: FlowStatusType = "failed";
}

export class AppSettingsHelper {

    private apiExtensionContext: ApiContext;

    constructor(apiExtensionContext: ApiContext) {
        this.apiExtensionContext = apiExtensionContext;
    }

    private getDatabase() {
        return this.apiExtensionContext.database;
    }

    async getAppSettings(): Promise<AppSettings | undefined | null> {
        let database = this.getDatabase();
        try {
            return await database(CollectionNames.APP_SETTINGS).first();
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getRedirectWhitelist(): Promise<string[] | undefined> {
        let settings = await this.getAppSettings();
        let redirect_whitelist = settings?.redirect_whitelist as string[] | undefined | null;
        if(!redirect_whitelist){
            return undefined;
        }
        return redirect_whitelist;
    }

    async getFoodNotificationStatus(): Promise<FlowStatus | undefined> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.notifications_foods_status) {
            return appSettings.notifications_foods_status as FlowStatus;
        }
        return undefined
    }

    async setFoodNotificationStatus(status: FlowStatus) {
        let database = this.getDatabase();
        await database(CollectionNames.APP_SETTINGS).update({
            notifications_foods_status: status
        });
    }

    async getCashregisterParsingStatus(): Promise<FlowStatus | undefined> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.cashregisters_parsing_status) {
            return appSettings.cashregisters_parsing_status as FlowStatus;
        }
        return undefined
    }

    async setCashregisterParsingStatus(status: FlowStatus) {
        let database = this.getDatabase();
        await database(CollectionNames.APP_SETTINGS).update({
            cashregisters_parsing_status: status
        });
    }

    async isCashregisterParsingEnabled(): Promise<boolean> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.cashregisters_parsing_enabled) {
            return appSettings.cashregisters_parsing_enabled;
        }
        return false;
    }



}
