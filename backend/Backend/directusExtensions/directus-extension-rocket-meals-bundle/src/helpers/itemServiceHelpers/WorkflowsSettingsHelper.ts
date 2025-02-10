import {CollectionNames} from "../CollectionNames";
import {AppSettings, WorkflowsSettings} from "../../databaseTypes/types";
import {ApiContext} from "../ApiContext";
import {ItemsServiceCreator} from "../ItemsServiceCreator";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";

export class WorkflowsSettingsStatus {
    public static readonly _statuses = {
        finished: "finished" as const,
        running: "running" as const,
    };

    static readonly FINISHED: WorkflowsSettingsStatusType = WorkflowsSettingsStatus._statuses.finished;
    static readonly RUNNING: WorkflowsSettingsStatusType = WorkflowsSettingsStatus._statuses.running;
}

export type WorkflowsSettingsStatusType = (typeof WorkflowsSettingsStatus._statuses)[keyof typeof WorkflowsSettingsStatus._statuses];

export class WorkflowsSettingsHelper {

    private apiExtensionContext: ApiContext;
    private eventContext?: EventContext;

    constructor(apiExtensionContext: ApiContext, eventContext?: EventContext) {
        this.apiExtensionContext = apiExtensionContext;
        this.eventContext = eventContext
    }

    private getDatabase() {
        return this.apiExtensionContext.database;
    }

    async setWorkflowsSettings(appSettings: Partial<WorkflowsSettings>) {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext, this.eventContext);
        const itemsService = await itemsServiceCreator.getItemsService<WorkflowsSettings>(CollectionNames.WORKFLOWS_SETTINGS);
        await itemsService.upsertSingleton(appSettings);
    }

    async getWorkflowsSettings(): Promise<Partial<WorkflowsSettings> | undefined | null> {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiExtensionContext);
        const itemsService = await itemsServiceCreator.getItemsService<WorkflowsSettings>(CollectionNames.WORKFLOWS_SETTINGS);
        return await itemsService.readSingleton({});
    }

    async getWorkflowsState(): Promise<WorkflowsSettingsStatus | undefined> {
        const appSettings = await this.getWorkflowsSettings();
        if (appSettings?.workflows_state) {
            return appSettings.workflows_state as WorkflowsSettingsStatus;
        }
        return undefined
    }

    async setWorkflowsStateWithHookTrigger(status: WorkflowsSettingsStatusType) {
        await this.setWorkflowsSettings({
            workflows_state: status as string
        })
    }

    async setWorkflowsStateWithoutHookTrigger(status: WorkflowsSettingsStatusType) {
        let database = this.getDatabase();
        await database(CollectionNames.WORKFLOWS_SETTINGS).update({
            workflows_state: status
        });
    }

}
