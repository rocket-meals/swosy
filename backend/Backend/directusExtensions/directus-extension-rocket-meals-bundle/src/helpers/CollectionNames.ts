import {CanteenFoodFeedbackReportSchedulesReportRecipients} from "../databaseTypes/types";

/**
 * Helper for Account things
 */
export function getAllCollectionNames() {
    return [
        CollectionNames.APP_SETTINGS,
        CollectionNames.APP_FEEDBACKS,
        CollectionNames.BUILDINGS,
        CollectionNames.WASHINGMACHINES,
        CollectionNames.WASHINGMACHINES_JOBS,
        CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES,
        CollectionNames.CASHREGISTERS,
        CollectionNames.CASHREGISTERS_TRANSACTIONS,
        CollectionNames.COLLECTIONS_DATES_LAST_UPDATE,
        CollectionNames.FOODS,
        CollectionNames.FOODS_FEEDBACKS,
        CollectionNames.FOODS_MARKINGS,
        CollectionNames.MARKINGS,
        CollectionNames.MARKINGS_EXCLUSIONS,
        CollectionNames.FOODOFFER_MARKINGS,
        CollectionNames.FOODS_FEEDBACK_LABELS,
        CollectionNames.APARTMENTS,
        CollectionNames.NEWS,
        CollectionNames.PROFILES,
        CollectionNames.UTILIZATION_GROUPS,
        CollectionNames.UTILIZATION_ENTRIES,
        CollectionNames.BUSINESSHOURS,
        CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES,
        CollectionNames.USERS,
        CollectionNames.CANTEENS,
        CollectionNames.CANTEENS_FEEDBACK_LABELS,
        CollectionNames.MAILS,
        CollectionNames.PUSH_NOTIFICATIONS,
        CollectionNames.DEVICES,
        CollectionNames.FOODOFFERS,
        CollectionNames.REPORT_RECIPIENTS,
        CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_REPORT_RECIPIENTS,
        CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_CANTEENS,
        CollectionNames.WORKFLOWS_SETTINGS,
        CollectionNames.WORKFLOWS,
        CollectionNames.WORKFLOWS_RUNS,
    ];
}

export class CollectionNames{
    static APP_SETTINGS = "app_settings"
    static APP_FEEDBACKS = "app_feedbacks"
    static CASHREGISTERS = "cashregisters"
    static CASHREGISTERS_TRANSACTIONS = "cashregisters_transactions"
    static COLLECTIONS_DATES_LAST_UPDATE = "collections_dates_last_update"

    static BUILDINGS = "buildings"
    static FOODS = "foods"
    static FOODS_FEEDBACKS= "foods_feedbacks"
    static FOODS_CATEGORIES = "foods_categories"
    static FOODS_ATTRIBUTES = "foods_attributes"

    static MAILS = "mails"

    static CANTEENS_FEEDBACK_LABELS = "canteens_feedbacks_labels"
    static CANTEENS_FEEDBACKS_LABELS_ENTRIES = "canteens_feedbacks_labels_entries"

    // FoodsFeedbacksLabelsEntries
    static FOODS_FEEDBACKS_LABELS_ENTRIES = "foods_feedbacks_labels_entries"
    static FOODS_MARKINGS = "foods_markings"
    static MARKINGS = "markings"
    static MARKINGS_EXCLUSIONS = "markings_exclusions"
    static FOODOFFER_MARKINGS = "foodoffers_markings"
    static FOODS_FEEDBACK_LABELS = "foods_feedbacks_labels"

    static APARTMENTS = "apartments"

    static WASHINGMACHINES = "washingmachines"
    static WASHINGMACHINES_JOBS = "washingmachines_jobs"

    static NEWS = "news"

    static PROFILES = "profiles"

    static UTILIZATION_GROUPS = "utilizations_groups"
    static UTILIZATION_ENTRIES = "utilizations_entries"
    static BUSINESSHOURS = "businesshours"

    static CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES = "canteen_food_feedback_report_schedules"
    static CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_REPORT_RECIPIENTS = "canteen_food_feedback_report_schedules_report_recipients"
    static CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_CANTEENS = "canteen_food_feedback_report_schedules_canteens"
    static REPORT_RECIPIENTS = "report_recipients"

    static USERS = "directus_users"

    static CANTEENS = "canteens"

    static PUSH_NOTIFICATIONS = "push_notifications"
    static DEVICES = "devices"

    static FOODOFFERS = "foodoffers"
    static FOODOFFER_CATEGORIES = "foodoffers_categories"

    static WORKFLOWS_SETTINGS = "workflows_settings"
    static WORKFLOWS = "workflows"
    static WORKFLOWS_RUNS = "workflows_runs"

}