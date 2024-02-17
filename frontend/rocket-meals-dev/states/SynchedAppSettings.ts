import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Apartments, AppSettings, Buildings, Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw, useSynchedResourceSingleRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";

async function loadAppSettingsFromServer(): Promise<AppSettings> {
  let collectionHelper = new CollectionHelper<AppSettings>("app_settings");
  return await collectionHelper.readSingletonItem();
}

export function useSynchedAppSettings(): [(AppSettings | undefined), ((newValue: AppSettings, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourceOnly, setResourceOnly, resourceRaw, setResourceRaw] = useSynchedResourceSingleRaw<AppSettings>(PersistentStore.app_settings);
  const demo = useIsDemo()

  console.log("useSynchedAppSettings")
  console.log(resourceRaw)

  let lastUpdate = resourceRaw?.lastUpdate;
  let usedResources = resourceOnly;
  if(demo) {
    usedResources = getDemoAppSettings()
  }

  async function updateFromServer(nowInMs?: number) {
    let resource = await loadAppSettingsFromServer();
    setResourceOnly(resource, nowInMs);
  }

  return [usedResources, setResourceOnly, lastUpdate, updateFromServer]
}

function getDemoAppSettings(): AppSettings {

  let demoResource: AppSettings = {
    app_stores: "",
    app_url_to_apple_store: "",
    app_url_to_google_store: "",
    api_version: "",
    balance_enabled: false,
    balance_settings: "",
    buildings_enabled: false,
    buildings_parsing_enabled: false,
    buildings_parsing_last_date: "",
    buildings_parsing_status: "",
    buildings_settings: "",
    cashregisters_parsing_enabled: false,
    cashregisters_parsing_last_date: "",
    cashregisters_parsing_status: "",
    cashregisters_settings: "",
    course_timetable_enabled: false,
    course_timetable_settings: "",
    date_created: "",
    date_privacy_policy_updated: "",
    date_updated: "",
    foods_enabled: false,
    foods_parsing_enabled: false,
    foods_parsing_last_date: "",
    foods_parsing_status: "",
    foods_placeholder_image: null,
    foods_placeholder_image_thumb_hash: "",
    foods_ratings_amount_display: false,
    foods_ratings_average_display: false,
    foods_ratings_type: "",
    foods_settings: "",
    housing_enabled: false,
    housing_maps_enabled: false,
    housing_parsing_enabled: false,
    housing_parsing_last_date: "",
    housing_parsing_status: "",
    housing_settings: "",
    housing_translations: [],
    id: 0,
    maintenance_end: "",
    maintenance_settings: "",
    maintenance_start: "",
    news_enabled: false,
    news_parsing_enabled: false,
    news_parsing_last_date: "",
    news_parsing_status: "",
    news_settings: "",
    notifications_android_enabled: false,
    notifications_email_enabled: false,
    notifications_ios_enabled: false,
    notifications_settings: "",
    status: "",
    user_created: "",
    user_updated: "",
    utilization_forecast_calculation_enabled: false,
    utilization_forecast_calculation_last_date: "",
    utilization_forecast_calculation_status: "",
    utilization_settings: ""
  }

  return demoResource
}