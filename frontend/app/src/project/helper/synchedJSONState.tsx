import {useSynchedState} from "../../kitcheningredients";
import {StorageKeys} from "./synchedVariables/StorageKeys";
import {useSynchedCanteenBuilding} from "../components/canteen/CanteenHelper";
import {Apartments, Buildings} from "../directusTypes/types";
import {NewsHelper} from "../components/news/NewsHelper";
import {WashingmashineHelper} from "../components/washingmachine/WashingmashineHelper";
import {ConversationHelper} from "../components/conversations/ConversationHelper";
import {useDirectusTranslation} from "../components/translations/DirectusTranslationUseFunction";
import {BuildingHelper} from "../components/buildings/BuildingHelper";
import {HousingHelper} from "../components/housing/HousingHelper";

export function useJSONState(storageKey): [value: any, setValue: (value) => {}, rawValue: any] {
    let [jsonStateAsString, setJsonStateAsString] = useSynchedState(storageKey);
    let rawValue = jsonStateAsString;
    let usedJsonStateAsString = jsonStateAsString;
    if(usedJsonStateAsString === undefined || usedJsonStateAsString === "undefined") {
        usedJsonStateAsString = "{}";
    }
    const parsedJSON = JSON.parse(usedJsonStateAsString || "{}");
    const setValue = (dict) => setJsonStateAsString(JSON.stringify(dict))
    return [
        parsedJSON,
        setValue,
        rawValue
    ]
}

export function useJSONStateWithDefaultValue(storageKey, defaultValue): [value: any, setValue: (value) => {}, rawValue: any] {
    let [parsedJSON, setValue, rawValue] = useJSONState(storageKey);
    let usedParsedJSON = parsedJSON;
    if(rawValue === undefined || rawValue === "undefined") {
        usedParsedJSON = defaultValue;
    }
    return [
        usedParsedJSON,
        setValue,
        rawValue
    ]
}

export function useDebugMode(): [value: any, setValue: (value) => {}] {
    const [value, setValue] = useJSONState(StorageKeys.CACHED_DEBUG_MODE);
    return [value===true, setValue]; //why ever demo is an object?
}

export function usePerformanceMode(): [value: any, setValue: (value) => {}] {
    const [value, setValue] = useJSONState(StorageKeys.CACHED_LOCAL_PERFORMANCE_MODE);
    return [value===true, setValue]; //why ever demo is an object?
}

export function useDemoMode(): [value: any, setValue: (value) => {}, rawValue: string] {
    const [value, setValue, rawValue] = useJSONState(StorageKeys.CACHED_DEMO_MODE);
    return [value===true, setValue, rawValue]; //why ever demo is an object?
}

export function useSynchedRemoteSettings(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_REMOTEAPPSETTINGS)
}

export function useSynchedChatroomsSettings(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_CHATROOMS)
}

export function useSynchedSettingsFoods(): [value: any, setValue: (value) => {}, rawValue?: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_MEALS)
}

export function useSynchedSettingsUtilizations(): [value: any, setValue: (value) => {}, rawValue?: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_UTILIZATIONS)
}

export function useSynchedSettingsAccountBalance(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_ACCOUNT_BALANCE)
}

export function useSynchedSettingsCourseTimetable(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_COURSE_TIMETABLE)
}

export function useSynchedSettingsNotifications(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_NOTIFICATIONS)
}

export function useSynchedSettingsHousing(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_HOUSING)
}

export function useSynchedSettingsNews(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_NEWS)
}

export function useSynchedSettingsBuildings(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_SETTINGS_BUILDINGS)
}


export function useSynchedDirectusSettings(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_DIRECTUSSETTINGS)
}

export function useSynchedDirectusLanguage(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_DIRECTUS_LANGUAGES)
}

export function useSynchedNews(): [value: any, setValue: (value) => {}, rawValue: any] {
    const [demo, setDemo] = useDemoMode();
    const synchedResource = useJSONState(StorageKeys.CACHED_NEWS)
    if(demo){
        // @ts-ignore
        return [NewsHelper.getDemoNewsDict(), (value) => {}, ""];
    }
    return synchedResource
}

export function useSynchedChatroomsDict(): [value: any, setValue: (value) => {}, rawValue: any] {
    const [demo, setDemo] = useDemoMode();
    const synchedResources = useJSONState(StorageKeys.CACHED_CHATROOMS);
    if(demo){
        // @ts-ignore
        return [ConversationHelper.getDemoDict(), (value) => {}, ""];
    }
    return synchedResources
}

export function useSynchedChatroomTopicsDict(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_CHATROOMTOPICS)
}

export function useSynchedMarkingsDict(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_MARKINGS)
}

export function useSynchedAppTranslations(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_APP_TRANSLATIONS)
}

export function useSynchedRemoteFields(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_REMOTEAPPFIELDS)
}

export function useSynchedWikis(): [value: any, setValue: (value) => {}, useWikiByIdOrCustomId: (wiki_id?, custom_id?) => any, useWikiTitle: (wiki_id?, custom_id?) => any] {
    let [wikis, setWikis] = useJSONState(StorageKeys.CACHED_WIKIS);

    function useWikiByIdOrCustomId(wiki_id?, custom_id?){
        if(!!wiki_id){
            return wikis?.[wiki_id];
        } else {
            if(!!custom_id){
                let wikiIds = Object.keys(wikis);
                for(let wikiId of wikiIds){
                    let wiki = wikis[wikiId];
                    if(wiki?.custom_id === custom_id){
                        return wiki;
                    }
                }
            }
        }
        return null;
    }

    function useWikiTitle(wiki_id?, custom_id?){
        const wiki = useWikiByIdOrCustomId(wiki_id, custom_id);
        let translations = wiki?.translations;
        const title = useDirectusTranslation(translations, "title");
        return title;
    }

    return [wikis, setWikis, useWikiByIdOrCustomId, useWikiTitle];
}

export function useSynchedBuilding(resource_id): Buildings {
    const [resources, setResources] = useSynchedBuildingsDict();
    return resources?.[resource_id];
}

export function useSynchedBuildingsDict(): [value: Record<string, Buildings>, setValue: (value) => {}, rawValue: any] {
    const [demo, setDemo] = useDemoMode();
    const synchedResources = useJSONState(StorageKeys.CACHED_BUILDINGS);
    if(demo){
        // @ts-ignore
        return [BuildingHelper.getDemoBuildingsDict(), (value) => {}, ""];
    }
    return synchedResources
}

export function useSynchedApartment(resource_id): any {
    const [resourceDict, setResourcesDict] = useSynchedApartmentsDict();
    let resource = resourceDict?.[resource_id]
    return resource;
}

export function useSynchedApartmentsDict(): [value: Record<string, Apartments>, setValue: (value) => {}, rawValue: any] {
    const [demo, setDemo] = useDemoMode();
    const synchedResource = useJSONState(StorageKeys.CACHED_APARTMENTS);
    if(demo){
        // @ts-ignore
        return [HousingHelper.getDemoHousingDict(), (value) => {}, ""];
    }

    return synchedResource
}

export function useSynchedWashingmachine(resource_id): any {
    const [resourceDict, setResourcesDict] = useSynchedWashingmachinesDict();
    return resourceDict?.[resource_id];
}

export function useSynchedWashingmachinesDict(): [value: Record<string, Apartments>, setValue: (value) => {}, rawValue: any] {
    const [demo, setDemo] = useDemoMode();
    const synchedResource = useJSONState(StorageKeys.CACHED_WASHINGMACHINES);
    if(demo){
        // @ts-ignore
        return [WashingmashineHelper.getDemoWashingmachineDict(), () => {}]
    }
    return synchedResource
}

export function useSynchedImageOverlays(resource_id): any {
    const [resourceDict, setResourcesDict] = useSynchedImageOverlaysDict();
    return resourceDict?.[resource_id];
}

export function useSynchedImageOverlaysDict(): [value: Record<string, Apartments>, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_IMAGE_OVERLAYS)
}

export function useSynchedNotificationsLocalDict(): [value: Record<string, Apartments>, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_NOTIFICATIONS_LOCAL)
}

export function useSynchedBusinesshoursDict(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_BUSINESSHOURS)
}

export function useSynchedCanteen(resource_id): any {
    const [canteensDict, setCanteensDict] = useSynchedCanteensDict();
    return canteensDict?.[resource_id];
}

export function useSynchedCanteensDict(): [value: any, setValue: (value) => {}, rawValue: any] {
    return useJSONState(StorageKeys.CACHED_CANTEENS)
}

