import {ApiContext} from "./ApiContext";

import {CashregisterHelper} from "./itemServiceHelpers/CashregisterHelper";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {CollectionNames} from "./CollectionNames";
import {MailService as MailServiceType} from "@directus/api";
import {
    Apartments, AppFeedbacks, Buildings,
    Canteens,
    CollectionsDatesLastUpdate,
    Devices, DirectusUsers,
    Foodoffers,
    Foods,
    FoodsFeedbacks,
    FoodsFeedbacksLabels,
    FoodsFeedbacksLabelsEntries, Markings, MarkingsExclusions, News, Profiles,
    PushNotifications, UtilizationsEntries, UtilizationsGroups, Washingmachines
} from "../databaseTypes/types";
import {ServerServiceCreator} from "./ItemsServiceCreator";
import {EmailOptions} from "@directus/api/dist/services/mail";
import {AppSettingsHelper} from "./itemServiceHelpers/AppSettingsHelper";
import {AutoTranslationSettingsHelper} from "./itemServiceHelpers/AutoTranslationSettingsHelper";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";

export class MyDatabaseHelper {

    private apiContext: ApiContext;
    private eventContext: EventContext | undefined;

    constructor(apiContext: ApiContext, eventContext?: EventContext) {
        this.apiContext = apiContext;
        this.eventContext = eventContext; // if available we should use eventContext - https://github.com/directus/directus/discussions/11051
        // its better to use the eventContext, because of reusing the database connection instead of creating a new one
    }

    async getServerInfo() {
        const serverServiceCreator = new ServerServiceCreator(this.apiContext);
        return await serverServiceCreator.getServerInfo();
    }

    async sendMail(options: EmailOptions) {
        let {MailService} = this.apiContext.services;
        const getSchema = this.apiContext.getSchema;
        const database = this.apiContext.database;
        const schema = await getSchema();
        let mailService: MailServiceType = new MailService({
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });
        return await mailService.send(options);
    }

    getAppSettingsHelper() {
        return new AppSettingsHelper(this.apiContext, this.eventContext);
    }

    getAutoTranslationSettingsHelper() {
        return new AutoTranslationSettingsHelper(this.apiContext, this.eventContext);
    }

    getAppFeedbacksHelper() {
        return new ItemsServiceHelper<AppFeedbacks>(this.apiContext, CollectionNames.APP_FEEDBACKS, this.eventContext);
    }

    getCashregisterHelper() {
        return new CashregisterHelper(this.apiContext);
    }

    getCollectionDatesLastUpdateHelper() {
        return new ItemsServiceHelper<CollectionsDatesLastUpdate>(this.apiContext, CollectionNames.COLLECTIONS_DATES_LAST_UPDATE, this.eventContext);
    }

    getFoodFeedbacksHelper() {
        return new ItemsServiceHelper<FoodsFeedbacks>(this.apiContext, CollectionNames.FOODS_FEEDBACKS, this.eventContext);
    }

    getFoodsHelper() {
        return new ItemsServiceHelper<Foods>(this.apiContext, CollectionNames.FOODS, this.eventContext);
    }

    getFoodFeedbackLabelsHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabels>(this.apiContext, CollectionNames.FOODS_FEEDBACK_LABELS, this.eventContext);
    }

    getFoodFeedbackLabelEntriesHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabelsEntries>(this.apiContext, CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES, this.eventContext);
    }

    getFoodoffersHelper() {
        return new ItemsServiceHelper<Foodoffers>(this.apiContext, CollectionNames.FOODOFFERS, this.eventContext);
    }

    getDevicesHelper() {
        return new ItemsServiceHelper<Devices>(this.apiContext, CollectionNames.DEVICES, this.eventContext);
    }

    getPushNotificationsHelper() {
        return new ItemsServiceHelper<PushNotifications>(this.apiContext, CollectionNames.PUSH_NOTIFICATIONS, this.eventContext);
    }

    getProfilesHelper() {
        return new ItemsServiceHelper<Profiles>(this.apiContext, CollectionNames.PROFILES, this.eventContext);
    }

    getMarkingsHelper() {
        return new ItemsServiceHelper<Markings>(this.apiContext, CollectionNames.MARKINGS, this.eventContext);
    }

    getMarkingsExclusionsHelper() {
        return new ItemsServiceHelper<MarkingsExclusions>(this.apiContext, CollectionNames.MARKINGS_EXCLUSIONS, this.eventContext);
    }

    getCanteensHelper() {
        return new ItemsServiceHelper<Canteens>(this.apiContext, CollectionNames.CANTEENS, this.eventContext);
    }

    getApartmentsHelper() {
        return new ItemsServiceHelper<Apartments>(this.apiContext, CollectionNames.APARTMENTS, this.eventContext);
    }

    getBuildingsHelper() {
        return new ItemsServiceHelper<Buildings>(this.apiContext, CollectionNames.BUILDINGS, this.eventContext);
    }

    getNewsHelper() {
        return new ItemsServiceHelper<News>(this.apiContext, CollectionNames.NEWS, this.eventContext);
    }

    getUsersHelper() {
        return new ItemsServiceHelper<DirectusUsers>(this.apiContext, CollectionNames.USERS, this.eventContext);
    }

    getUtilizationEntriesHelper() {
        return new ItemsServiceHelper<UtilizationsEntries>(this.apiContext, CollectionNames.UTILIZATION_ENTRIES, this.eventContext);
    }

    getUtilizationGroupsHelper() {
        return new ItemsServiceHelper<UtilizationsGroups>(this.apiContext, CollectionNames.UTILIZATION_GROUPS, this.eventContext);
    }

    getWashingmachinesHelper() {
        return new ItemsServiceHelper<Washingmachines>(this.apiContext, CollectionNames.WASHINGMACHINES, this.eventContext);
    }
}
