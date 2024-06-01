import {Markings, PopupEvents, PopupEventsTranslations} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {IconNames} from "@/constants/IconNames";
import {MARKDOWN_EXAMPLE} from "@/components/markdown/ThemedMarkdown";
import {Weekday} from "@/helper/date/DateHelper";
import {useSyncState} from "@/helper/syncState/SyncState";
import {useGlobalSearchParams} from "expo-router";
import {useDebugRaw} from "@/states/Debug";
import {useEffect, useState} from "react";

export const TABLE_NAME_POPUPEVENTS = 'popup_events';
const cacheHelperDeepFields_markings: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_POPUPEVENTS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["popup_events_translations"],
	}
])
export async function loadPopupEventsFromServer(): Promise<PopupEvents[]> {
	const collectionHelper = new CollectionHelper<PopupEvents>(TABLE_NAME_POPUPEVENTS);
	const query = cacheHelperDeepFields_markings.getQuery()
	return await collectionHelper.readItems(query);
}

function getDemoTranslation(id: string, title: string, content: string): PopupEventsTranslations[] {
	let languages = getDemoLanguagesDict();
	let translations: PopupEventsTranslations[] = []

	let index = 0
	for (let languageKey in languages) {
		let language = languages[languageKey]
		let translation_id = id+"-"+index
		translations.push({
			id: Math.random()*100,
			popup_events_id: id,
			title: title,
			content: content,
			languages_code: language.code,
			translation_settings: ""
		})
		index++
	}

	return translations
}

const indefinetlyLongDateStart = new Date()

function getDemoPopupEvents(): Record<string, PopupEvents | null | undefined> {
	const eventIndefinetlyLong: PopupEvents = {
		id: "eventIndefinetlyLong",
		alias: "Demo Event Indefinetly Long",
		image_remote_url: "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
		date_start: indefinetlyLongDateStart.toISOString(),
		date_end: null,
		status: "published",
		translations: getDemoTranslation("eventIndefinetlyLong", "Event Indefinetly Long", MARKDOWN_EXAMPLE)
	}

	return {
		[eventIndefinetlyLong.id]: eventIndefinetlyLong
	}
}

export function usePopupEventsAreHidden(): boolean {
	const [firstRender, setFirstRender] = useState(true)
	const globalSearchParams = useGlobalSearchParams()
	// globalSearchParams is null in the first render we need to check for that so we will return true in the first render
	useEffect(() => {
		setFirstRender(false)
	}, [])

	if (firstRender) {
		return true
	}

	const paramRaw = globalSearchParams?.hide_popup_events
	const param = paramRaw === "true"

	return param
}

export function useSynchedPopupEventsDict(): [( Record<string, PopupEvents | null | undefined> | null | undefined), (callback: (currentValue: (Record<string, PopupEvents | null | undefined> | null | undefined)) => Record<string, PopupEvents | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<PopupEvents>(PersistentStore.popup_events);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoPopupEvents()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceList = await loadPopupEventsFromServer();
		const markingsDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentValue) => {
			return markingsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_markings.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export function useSynchedPopupEventsReadDict(): [( Record<string, boolean | null | undefined>), (callback: (currentValue: (Record<string, boolean | null | undefined>)) => Record<string, boolean | null | undefined>) => void]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<boolean>(PersistentStore.popup_events_read);
	let usedResource = resourcesOnly;
	if(!usedResource) {
		usedResource = {};
	}

	return [usedResource, setResourcesOnly]
}