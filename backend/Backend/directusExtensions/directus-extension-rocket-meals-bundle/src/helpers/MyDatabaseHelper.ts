import {ApiContext} from "./ApiContext";

import {CashregisterHelper} from "./itemServiceHelpers/CashregisterHelper";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {CollectionNames} from "./CollectionNames";
import {
    Apartments,
    AppFeedbacks,
    Buildings,
    Canteens,
    CanteensFeedbacksLabels,
    CanteensFeedbacksLabelsEntries,
    CollectionsDatesLastUpdate,
    Devices,
    DirectusUsers,
    Foodoffers,
    FoodoffersCategories,
    Foods,
    FoodsAttributes,
    FoodsCategories,
    FoodsFeedbacks,
    FoodsFeedbacksLabels,
    FoodsFeedbacksLabelsEntries,
    FormAnswers,
    FormExtracts,
    FormExtractsFormFields,
    FormFields,
    Forms,
    FormSubmissions,
    Mails, MailsFiles,
    Markings,
    MarkingsExclusions,
    News,
    Profiles,
    PushNotifications,
    UtilizationsEntries,
    UtilizationsGroups,
    Washingmachines,
    WashingmachinesJobs,
    Workflows
} from "../databaseTypes/types";
import {ServerServiceCreator} from "./ItemsServiceCreator";
import {AppSettingsHelper} from "./itemServiceHelpers/AppSettingsHelper";
import {AutoTranslationSettingsHelper} from "./itemServiceHelpers/AutoTranslationSettingsHelper";
import {WorkflowsRunHelper} from "./itemServiceHelpers/WorkflowsRunHelper";
import {FilesServiceHelper} from "./FilesServiceHelper";
import {EventContext as ExtentContextDirectusTypes} from "@directus/types";
import {EventContext as EventContextForFlows} from "@directus/extensions/node_modules/@directus/types/dist/events";

export class MyDatabaseHelper {

    public apiContext: ApiContext;
    public eventContext: ExtentContextDirectusTypes | undefined;

    constructor(apiContext: ApiContext, eventContext?: EventContextForFlows) {
        this.apiContext = apiContext;
        // if available we should use eventContext - https://github.com/directus/directus/discussions/11051
        this.eventContext = eventContext as ExtentContextDirectusTypes; // stupid typescript error, because of the import
        // its better to use the eventContext, because of reusing the database connection instead of creating a new one
    }

    async getServerInfo() {
        const serverServiceCreator = new ServerServiceCreator(this.apiContext);
        return await serverServiceCreator.getServerInfo();
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

    getFoodsCategoriesHelper() {
        return new ItemsServiceHelper<FoodsCategories>(this.apiContext, CollectionNames.FOODS_CATEGORIES, this.eventContext);
    }

    getFoodsAttributesHelper() {
        return new ItemsServiceHelper<FoodsAttributes>(this.apiContext, CollectionNames.FOODS_ATTRIBUTES, this.eventContext);
    }

    getFoodFeedbackLabelEntriesHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabelsEntries>(this.apiContext, CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES, this.eventContext);
    }

    getCanteenFeedbackLabelsHelper() {
        return new ItemsServiceHelper<CanteensFeedbacksLabels>(this.apiContext, CollectionNames.CANTEENS_FEEDBACK_LABELS, this.eventContext);
    }

    getCanteenFeedbackLabelsEntriesHelper() {
        return new ItemsServiceHelper<CanteensFeedbacksLabelsEntries>(this.apiContext, CollectionNames.CANTEENS_FEEDBACKS_LABELS_ENTRIES, this.eventContext);
    }

    getFormsHelper() {
        return new ItemsServiceHelper<Forms>(this.apiContext, CollectionNames.FORMS, this.eventContext);
    }

    getFormExtractsHelper() {
        return new ItemsServiceHelper<FormExtracts>(this.apiContext, CollectionNames.FORM_EXTRACTS, this.eventContext);
    }

    getFormExtractFormFieldsHelper() {
        return new ItemsServiceHelper<FormExtractsFormFields>(this.apiContext, CollectionNames.FORM_EXTRACTS_FORM_FIELDS, this.eventContext);
    }

    getFormsFieldsHelper() {
        return new ItemsServiceHelper<FormFields>(this.apiContext, CollectionNames.FORM_FIELDS, this.eventContext);
    }

    getFormsSubmissionsHelper() {
        return new ItemsServiceHelper<FormSubmissions>(this.apiContext, CollectionNames.FORM_SUBMISSIONS, this.eventContext);
    }

    getFormsAnswersHelper() {
        return new ItemsServiceHelper<FormAnswers>(this.apiContext, CollectionNames.FORM_ANSWERS, this.eventContext);
    }

    getFoodoffersHelper() {
        return new ItemsServiceHelper<Foodoffers>(this.apiContext, CollectionNames.FOODOFFERS, this.eventContext);
    }

    getFoodofferCategoriesHelper() {
        return new ItemsServiceHelper<FoodoffersCategories>(this.apiContext, CollectionNames.FOODOFFER_CATEGORIES, this.eventContext);
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

    getWashingmachinesJobsHelper() {
        return new ItemsServiceHelper<WashingmachinesJobs>(this.apiContext, CollectionNames.WASHINGMACHINES_JOBS, this.eventContext);
    }

    getWorkflowsHelper() {
        return new ItemsServiceHelper<Workflows>(this.apiContext, CollectionNames.WORKFLOWS, this.eventContext);
    }

    getWorkflowsRunsHelper() {
        return new WorkflowsRunHelper(this.apiContext, CollectionNames.WORKFLOWS_RUNS, this.eventContext);
    }

    getItemsServiceHelper<T>(collectionName: string) {
        return new ItemsServiceHelper<T>(this.apiContext, collectionName, this.eventContext);
    }

    async sendMail(mail: Partial<Mails>) {
        let mailsHelper = this.getMailsHelper();
        return await mailsHelper.createOne(mail);
    }

    getMailsHelper() {
        return new ItemsServiceHelper<Mails>(this.apiContext, CollectionNames.MAILS, this.eventContext);
    }

    getMailsFilesHelper() {
        return new ItemsServiceHelper<MailsFiles>(this.apiContext, CollectionNames.MAILS_FILES, this.eventContext);
    }

    getFilesHelper(){
        return new FilesServiceHelper(this.apiContext, this.eventContext);
    }
}
