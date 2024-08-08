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

    async getAppSettingsEntry(): Promise<AppSettings | undefined | null> {
        let database = this.getDatabase();
        try {
            return await database(CollectionNames.APP_SETTINGS).first();
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getFoodNotificationStatus(): Promise<FlowStatus | undefined> {
        const appSettings = await this.getAppSettingsEntry();
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

}
