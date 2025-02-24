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
    Mails,
    MailsFiles,
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
import {ShareServiceHelper} from "./ShareServiceHelper";

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
        return new AppSettingsHelper(this.apiContext);
    }

    getAutoTranslationSettingsHelper() {
        return new AutoTranslationSettingsHelper(this.apiContext);
    }

    getAppFeedbacksHelper() {
        return new ItemsServiceHelper<AppFeedbacks>(this, CollectionNames.APP_FEEDBACKS);
    }

    getCashregisterHelper() {
        return new CashregisterHelper(this.apiContext);
    }

    getCollectionDatesLastUpdateHelper() {
        return new ItemsServiceHelper<CollectionsDatesLastUpdate>(this, CollectionNames.COLLECTIONS_DATES_LAST_UPDATE);
    }

    getFoodFeedbacksHelper() {
        return new ItemsServiceHelper<FoodsFeedbacks>(this, CollectionNames.FOODS_FEEDBACKS);
    }

    getFoodsHelper() {
        return new ItemsServiceHelper<Foods>(this, CollectionNames.FOODS);
    }

    getFoodFeedbackLabelsHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabels>(this, CollectionNames.FOODS_FEEDBACK_LABELS);
    }

    getFoodsCategoriesHelper() {
        return new ItemsServiceHelper<FoodsCategories>(this, CollectionNames.FOODS_CATEGORIES);
    }

    getFoodsAttributesHelper() {
        return new ItemsServiceHelper<FoodsAttributes>(this, CollectionNames.FOODS_ATTRIBUTES);
    }

    getFoodFeedbackLabelEntriesHelper() {
        return new ItemsServiceHelper<FoodsFeedbacksLabelsEntries>(this, CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES);
    }

    getCanteenFeedbackLabelsHelper() {
        return new ItemsServiceHelper<CanteensFeedbacksLabels>(this, CollectionNames.CANTEENS_FEEDBACK_LABELS);
    }

    getCanteenFeedbackLabelsEntriesHelper() {
        return new ItemsServiceHelper<CanteensFeedbacksLabelsEntries>(this, CollectionNames.CANTEENS_FEEDBACKS_LABELS_ENTRIES);
    }

    getFormsHelper() {
        return new ItemsServiceHelper<Forms>(this, CollectionNames.FORMS);
    }

    getFormExtractsHelper() {
        return new ItemsServiceHelper<FormExtracts>(this, CollectionNames.FORM_EXTRACTS);
    }

    getFormExtractFormFieldsHelper() {
        return new ItemsServiceHelper<FormExtractsFormFields>(this, CollectionNames.FORM_EXTRACTS_FORM_FIELDS);
    }

    getFormsFieldsHelper() {
        return new ItemsServiceHelper<FormFields>(this, CollectionNames.FORM_FIELDS);
    }

    getFormsSubmissionsHelper() {
        return new ItemsServiceHelper<FormSubmissions>(this, CollectionNames.FORM_SUBMISSIONS);
    }

    getFormsAnswersHelper() {
        return new ItemsServiceHelper<FormAnswers>(this, CollectionNames.FORM_ANSWERS);
    }

    getFoodoffersHelper() {
        return new ItemsServiceHelper<Foodoffers>(this, CollectionNames.FOODOFFERS);
    }

    getFoodofferCategoriesHelper() {
        return new ItemsServiceHelper<FoodoffersCategories>(this, CollectionNames.FOODOFFER_CATEGORIES);
    }

    getDevicesHelper() {
        return new ItemsServiceHelper<Devices>(this, CollectionNames.DEVICES);
    }

    getPushNotificationsHelper() {
        return new ItemsServiceHelper<PushNotifications>(this, CollectionNames.PUSH_NOTIFICATIONS);
    }

    getProfilesHelper() {
        return new ItemsServiceHelper<Profiles>(this, CollectionNames.PROFILES);
    }

    getMarkingsHelper() {
        return new ItemsServiceHelper<Markings>(this, CollectionNames.MARKINGS);
    }

    getMarkingsExclusionsHelper() {
        return new ItemsServiceHelper<MarkingsExclusions>(this, CollectionNames.MARKINGS_EXCLUSIONS);
    }

    getCanteensHelper() {
        return new ItemsServiceHelper<Canteens>(this, CollectionNames.CANTEENS);
    }

    getApartmentsHelper() {
        return new ItemsServiceHelper<Apartments>(this, CollectionNames.APARTMENTS);
    }

    getBuildingsHelper() {
        return new ItemsServiceHelper<Buildings>(this, CollectionNames.BUILDINGS);
    }

    getNewsHelper() {
        return new ItemsServiceHelper<News>(this, CollectionNames.NEWS);
    }

    getUsersHelper() {
        return new ItemsServiceHelper<DirectusUsers>(this, CollectionNames.USERS);
    }

    getShareServiceHelper() {
        return new ShareServiceHelper(this);
    }

    getUtilizationEntriesHelper() {
        return new ItemsServiceHelper<UtilizationsEntries>(this, CollectionNames.UTILIZATION_ENTRIES);
    }

    getUtilizationGroupsHelper() {
        return new ItemsServiceHelper<UtilizationsGroups>(this, CollectionNames.UTILIZATION_GROUPS);
    }

    getWashingmachinesHelper() {
        return new ItemsServiceHelper<Washingmachines>(this, CollectionNames.WASHINGMACHINES);
    }

    getWashingmachinesJobsHelper() {
        return new ItemsServiceHelper<WashingmachinesJobs>(this, CollectionNames.WASHINGMACHINES_JOBS);
    }

    getWorkflowsHelper() {
        return new ItemsServiceHelper<Workflows>(this, CollectionNames.WORKFLOWS);
    }

    getWorkflowsRunsHelper() {
        return new WorkflowsRunHelper(this, CollectionNames.WORKFLOWS_RUNS);
    }

    getItemsServiceHelper<T>(collectionName: string) {
        return new ItemsServiceHelper<T>(this, collectionName);
    }

    async sendMail(mail: Partial<Mails>) {
        let mailsHelper = this.getMailsHelper();
        return await mailsHelper.createOne(mail);
    }

    getMailsHelper() {
        return new ItemsServiceHelper<Mails>(this, CollectionNames.MAILS);
    }

    getMailsFilesHelper() {
        return new ItemsServiceHelper<MailsFiles>(this, CollectionNames.MAILS_FILES);
    }

    getFilesHelper(){
        return new FilesServiceHelper(this);
    }

}
