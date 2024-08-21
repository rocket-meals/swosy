/**
 * Helper for Account things
 */
export function getAllCollectionNames() {
    return [
        CollectionNames.APP_SETTINGS,
        CollectionNames.BUILDINGS,
        CollectionNames.WASHINGMACHINES,
        CollectionNames.FOODS_FEEDBACKS_LABELS_ENTRIES,
        CollectionNames.CASHREGISTERS,
        CollectionNames.CASHREGISTERS_TRANSACTIONS,
        CollectionNames.COLLECTIONS_DATES_LAST_UPDATE,
        CollectionNames.FOODS,
        CollectionNames.FOODS_FEEDBACKS,
        CollectionNames.FOODS_MARKINGS,
        CollectionNames.MARKINGS,
        CollectionNames.FOODOFFER_MARKINGS,
        CollectionNames.FOODS_FEEDBACK_LABELS,
        CollectionNames.APARTMENTS,
        CollectionNames.NEWS,
        CollectionNames.PROFILES,
        CollectionNames.UTILIZATION_GROUPS,
        CollectionNames.UTILIZATION_ENTRIES,
        CollectionNames.BUSINESSHOURS,
        CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_RECIPIENTS,
        CollectionNames.USERS,
        CollectionNames.CANTEENS,
        CollectionNames.PUSH_NOTIFICATIONS,
        CollectionNames.DEVICES,
        CollectionNames.FOODOFFERS,
    ];
}

export class CollectionNames{
    static APP_SETTINGS = "app_settings"
    static CASHREGISTERS = "cashregisters"
    static CASHREGISTERS_TRANSACTIONS = "cashregisters_transactions"
    static COLLECTIONS_DATES_LAST_UPDATE = "collections_dates_last_update"

    static BUILDINGS = "buildings"
    static FOODS = "foods"
    static FOODS_FEEDBACKS= "foods_feedbacks"

    // FoodsFeedbacksLabelsEntries
    static FOODS_FEEDBACKS_LABELS_ENTRIES = "foods_feedbacks_labels_entries"
    static FOODS_MARKINGS = "foods_markings"
    static MARKINGS = "markings"
    static FOODOFFER_MARKINGS = "foodoffers_markings"
    static FOODS_FEEDBACK_LABELS = "foods_feedbacks_labels"

    static APARTMENTS = "apartments"

    static WASHINGMACHINES = "washingmachines"

    static NEWS = "news"

    static PROFILES = "profiles"

    static UTILIZATION_GROUPS = "utilizations_groups"
    static UTILIZATION_ENTRIES = "utilizations_entries"
    static BUSINESSHOURS = "businesshours"

    static CANTEEN_FOOD_FEEDBACK_REPORT_RECIPIENTS = "canteen_food_feedback_report_recipients"

    static USERS = "directus_users"

    static CANTEENS = "canteens"

    static PUSH_NOTIFICATIONS = "push_notifications"
    static DEVICES = "devices"

    static FOODOFFERS = "foodoffers"

}