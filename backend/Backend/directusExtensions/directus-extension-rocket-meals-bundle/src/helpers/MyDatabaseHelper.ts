import {ApiContext} from "./ApiContext";
import {AppSettingsHelper} from "./AppSettingsHelper";
import {CashregisterHelper} from "./itemServiceHelpers/CashregisterHelper";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {CollectionNames} from "./CollectionNames";
import {
    Apartments, Buildings,
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

export class MyDatabaseHelper {

    private apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
    }

    async getServerInfo() {
        const serverServiceCreator = new ServerServiceCreator(this.apiContext);
        return await serverServiceCreator.getServerInfo();
    }

    getAppSettingsHelper() {
        return new AppSettingsHelper(this.apiContext);
    }

    getCashregisterHelper() {
        return new CashregisterHelper(this.apiContext);
    }

    getCollectionDatesLastUpdateHelper() {
        return new ItemsServiceHelper<CollectionsDatesLastUpdate>(this.apiContext, CollectionNames.COLLECTIONS_DATES_LAST_UPDATE);
    }

    getFoodFeedbacksHelper() {
        return new ItemsServiceHelper<FoodsFeedbacks>(this.apiContext, CollectionNames.FOODS_FEEDBACKS);
    }

    getFoodsHelper() {
        return new ItemsServiceHelper<Foods>(this.apiContext, CollectionNames.FOODS);
    }

    getFoodFeedbackLabelsHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabels>(this.apiContext, CollectionNames.FOODS_FEEDBACK_LABELS);
    }

    getFoodFeedbackLabelEntriesHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabelsEntries>(this.apiContext, CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES);
    }

    getFoodOffersHelper() {
        return new ItemsServiceHelper<Foodoffers>(this.apiContext, CollectionNames.FOODOFFERS);
    }

    getDevicesHelper() {
        return new ItemsServiceHelper<Devices>(this.apiContext, CollectionNames.DEVICES);
    }

    getPushNotificationsHelper() {
        return new ItemsServiceHelper<PushNotifications>(this.apiContext, CollectionNames.PUSH_NOTIFICATIONS);
    }

    getProfilesHelper() {
        return new ItemsServiceHelper<Profiles>(this.apiContext, CollectionNames.PROFILES);
    }

    getMarkingsHelper() {
        return new ItemsServiceHelper<Markings>(this.apiContext, CollectionNames.MARKINGS);
    }

    getMarkingsExclusionsHelper() {
        return new ItemsServiceHelper<MarkingsExclusions>(this.apiContext, CollectionNames.MARKINGS_EXCLUSIONS);
    }

    getCanteensHelper() {
        return new ItemsServiceHelper<Canteens>(this.apiContext, CollectionNames.CANTEENS);
    }

    getApartmentsHelper() {
        return new ItemsServiceHelper<Apartments>(this.apiContext, CollectionNames.APARTMENTS);
    }

    getBuildingsHelper() {
        return new ItemsServiceHelper<Buildings>(this.apiContext, CollectionNames.BUILDINGS);
    }

    getNewsHelper() {
        return new ItemsServiceHelper<News>(this.apiContext, CollectionNames.NEWS);
    }

    getUsersHelper() {
        return new ItemsServiceHelper<DirectusUsers>(this.apiContext, CollectionNames.USERS);
    }

    getUtilizationEntriesHelper() {
        return new ItemsServiceHelper<UtilizationsEntries>(this.apiContext, CollectionNames.UTILIZATION_ENTRIES);
    }

    getUtilizationGroupsHelper() {
        return new ItemsServiceHelper<UtilizationsGroups>(this.apiContext, CollectionNames.UTILIZATION_GROUPS);
    }

    getWashingmachinesHelper() {
        return new ItemsServiceHelper<Washingmachines>(this.apiContext, CollectionNames.WASHINGMACHINES);
    }
}
