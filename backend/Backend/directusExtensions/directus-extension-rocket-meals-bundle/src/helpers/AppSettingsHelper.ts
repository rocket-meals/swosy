import {CollectionNames} from "./CollectionNames";
import {AppSettings} from "../databaseTypes/types";
import {ApiContext} from "./ApiContext";
import {ItemsServiceCreator} from "./ItemsServiceCreator";

export class FlowStatus {
    public static readonly _statuses = {
        start: "start" as const,
        finished: "finished" as const,
        running: "running" as const,
        failed: "failed" as const,
    };

    static readonly START: FlowStatusType = FlowStatus._statuses.start;
    static readonly FINISHED: FlowStatusType = FlowStatus._statuses.finished;
    static readonly RUNNING: FlowStatusType = FlowStatus._statuses.running;
    static readonly FAILED: FlowStatusType = FlowStatus._statuses.failed;
}

export type FlowStatusType = (typeof FlowStatus._statuses)[keyof typeof FlowStatus._statuses];

export class AppSettingsHelper {

    static FIELD_APP_SETTINGS_FOODS_PARSING_STATUS = "foods_parsing_status";
    static FIELD_APP_SETTINGS_FOODS_PARSING_HASH = "foods_parsing_hash";
    static FIELD_APP_SETTINGS_FOODS_PARSING_LAST_RUN = "foods_parsing_last_date";

    private apiExtensionContext: ApiContext;

    constructor(apiExtensionContext: ApiContext) {
        this.apiExtensionContext = apiExtensionContext;
    }

    private getDatabase() {
        return this.apiExtensionContext.database;
    }

    async setAppSettings(appSettings: Partial<AppSettings>) {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext);
        const itemsService = await itemsServiceCreator.getItemsService<AppSettings>(CollectionNames.APP_SETTINGS);
        await itemsService.upsertSingleton(appSettings);
        /**
         * await this.database(TABLENAME_FLOWHOOKS).update({
         *             cashregisters_parsing_status: status
         *         });
         */
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

    async getFoodParsingStatus(): Promise<FlowStatus | undefined> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.foods_parsing_status) {
            return appSettings.foods_parsing_status as FlowStatus;
        }
        return undefined
    }

    async setFoodParsingStatus(status: FlowStatus, lastRun: Date | null) {
        let database = this.getDatabase();
        await database(CollectionNames.APP_SETTINGS).update({
            foods_parsing_status: status,
            foods_parsing_last_date: lastRun
        });
    }

    async isFoodParsingEnabled(): Promise<boolean> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.foods_parsing_enabled) {
            return appSettings.foods_parsing_enabled;
        }
        return false;
    }

    async getFoodParsingHash(): Promise<string | undefined> {
        const appSettings = await this.getAppSettings();
        if (appSettings?.foods_parsing_hash) {
            return appSettings.foods_parsing_hash;
        }
        return undefined
    }

    async setFoodParsingHash(hash: string) {
        await this.setAppSettings({
            [AppSettingsHelper.FIELD_APP_SETTINGS_FOODS_PARSING_HASH]: hash
        })
    }


}
