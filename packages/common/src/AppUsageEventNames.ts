/**
 * AppUsageEventNames.ts – the names of all anonymous usage events in `app_usage_events` and the
 * switch `app_settings.app_usage_events_enabled`, which decides which of them are collected.
 *
 * Shared by the app (sends most events), the backend (writes `food_details_opened` itself) and the
 * module page "Live-Puls" (shows them) – so the file stays free of imports, the page loads it in the
 * browser.
 */

export const AppUsageEventTypes = {
  APP_RATING: 'app_rating',
  FOOD: 'food',
  SCREEN_VIEW: 'screen_view',
  BUILDING: 'building',
  MARKING: 'marking',
  ACCOUNT: 'account',
} as const;

export type AppUsageEventType = (typeof AppUsageEventTypes)[keyof typeof AppUsageEventTypes];

/**
 * Every event name the apps and the backend send. The values are also the choices of
 * `app_settings.app_usage_events_enabled` – keep `data/directus-sync-data/.../app_settings/app_usage_events_enabled.json` in sync.
 */
export const AppUsageEventNames = {
  /** Directly before the native store review dialog is requested. */
  NATIVE_REVIEW_PROMPT_REQUESTED: 'native_review_prompt_requested',
  /** The details of a food offer were loaded (written by the backend). */
  FOOD_DETAILS_OPENED: 'food_details_opened',
  /** The details of a building were opened, `payload.building_id`. */
  BUILDING_DETAILS_OPENED: 'building_details_opened',
  /** The details of a marking were opened, `payload.marking_id`. */
  MARKING_DETAILS_OPENED: 'marking_details_opened',
  MAP_SCREEN_OPENED: 'map_screen_opened',
  COURSE_TIMETABLE_SCREEN_OPENED: 'course_timetable_screen_opened',
  NEWS_SCREEN_OPENED: 'news_screen_opened',
  HOUSING_SCREEN_OPENED: 'housing_screen_opened',
  ACCOUNT_BALANCE_SCREEN_OPENED: 'account_balance_screen_opened',
  FOODOFFERS_SCREEN_OPENED: 'foodoffers_screen_opened',
  CAMPUS_SCREEN_OPENED: 'campus_screen_opened',
  SETTINGS_SCREEN_OPENED: 'settings_screen_opened',
  DATA_ACCESS_SCREEN_OPENED: 'data_access_screen_opened',
  EATING_HABITS_SCREEN_OPENED: 'eating_habits_screen_opened',
  /** Once per app start of a user logged in via university (DFN), whatever status was reported, payload: the answer of `GET /university-affiliation`. */
  UNIVERSITY_STATUS_CHECKED: 'university_status_checked',
} as const;

export type AppUsageEventName = (typeof AppUsageEventNames)[keyof typeof AppUsageEventNames];

export const ALL_APP_USAGE_EVENT_NAMES: readonly AppUsageEventName[] = Object.values(AppUsageEventNames);

/** The events sent when a screen is opened (`event_type` `screen_view`). */
export const APP_USAGE_SCREEN_OPENED_EVENT_NAMES: readonly AppUsageEventName[] = [AppUsageEventNames.MAP_SCREEN_OPENED, AppUsageEventNames.COURSE_TIMETABLE_SCREEN_OPENED, AppUsageEventNames.NEWS_SCREEN_OPENED, AppUsageEventNames.HOUSING_SCREEN_OPENED, AppUsageEventNames.ACCOUNT_BALANCE_SCREEN_OPENED, AppUsageEventNames.FOODOFFERS_SCREEN_OPENED, AppUsageEventNames.CAMPUS_SCREEN_OPENED, AppUsageEventNames.SETTINGS_SCREEN_OPENED, AppUsageEventNames.DATA_ACCESS_SCREEN_OPENED, AppUsageEventNames.EATING_HABITS_SCREEN_OPENED];

/** One entry of the checkbox tree `app_settings.app_usage_events_enabled`: a group (with children) or an event. */
export type AppUsageEventChoice = {
  text: string;
  value: string;
  children?: AppUsageEventChoice[];
};

/**
 * The checkbox tree of `app_settings.app_usage_events_enabled` (Directus "Kontrollkästchen (Baum)"):
 * "Alle" on top, below it the events grouped by kind. Only the events (the leaves) are stored, the
 * groups are just there to tick or untick many at once (`valueCombining: leaf`). Keep
 * `data/directus-sync-data/.../app_settings/app_usage_events_enabled.json` in sync, the test checks it.
 */
export const APP_USAGE_EVENT_CHOICES: AppUsageEventChoice[] = [
  {
    text: 'Alle',
    value: 'group_all',
    children: [
      {
        text: 'Bildschirme',
        value: 'group_screens',
        children: [
          { text: 'Lageplan', value: AppUsageEventNames.MAP_SCREEN_OPENED },
          { text: 'Stundenplan', value: AppUsageEventNames.COURSE_TIMETABLE_SCREEN_OPENED },
          { text: 'News', value: AppUsageEventNames.NEWS_SCREEN_OPENED },
          { text: 'Wohnen', value: AppUsageEventNames.HOUSING_SCREEN_OPENED },
          { text: 'Guthaben', value: AppUsageEventNames.ACCOUNT_BALANCE_SCREEN_OPENED },
          { text: 'Speiseangebote', value: AppUsageEventNames.FOODOFFERS_SCREEN_OPENED },
          { text: 'Campus', value: AppUsageEventNames.CAMPUS_SCREEN_OPENED },
          { text: 'Einstellungen', value: AppUsageEventNames.SETTINGS_SCREEN_OPENED },
          { text: 'Datenauskunft', value: AppUsageEventNames.DATA_ACCESS_SCREEN_OPENED },
          { text: 'Essgewohnheiten', value: AppUsageEventNames.EATING_HABITS_SCREEN_OPENED },
        ],
      },
      {
        text: 'Details geöffnet',
        value: 'group_details',
        children: [
          { text: 'Speise', value: AppUsageEventNames.FOOD_DETAILS_OPENED },
          { text: 'Gebäude', value: AppUsageEventNames.BUILDING_DETAILS_OPENED },
          { text: 'Kennzeichnung', value: AppUsageEventNames.MARKING_DETAILS_OPENED },
        ],
      },
      { text: 'App-Bewertung: Store-Bewertungsdialog angefragt', value: AppUsageEventNames.NATIVE_REVIEW_PROMPT_REQUESTED },
      { text: 'Anmeldung: Hochschulstatus geprüft', value: AppUsageEventNames.UNIVERSITY_STATUS_CHECKED },
    ],
  },
];

/**
 * Whether `eventName` may be sent, given the value of `app_settings.app_usage_events_enabled`.
 *
 * - A list: only the events in it. All ticked collects everything, nothing ticked (`[]`) collects nothing.
 * - `null`/`undefined` (a server that does not know the field yet, or a row from before it existed):
 *   every event is collected, as before the setting existed.
 * - A JSON string is parsed first, anything unreadable counts as not set.
 */
export function isAppUsageEventEnabled(setting: unknown, eventName: string): boolean {
  let value = setting;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return true;
    }
  }
  if (!Array.isArray(value)) {
    return true;
  }
  return value.includes(eventName);
}
