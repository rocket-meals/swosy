import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Languages} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_LANGUAGES = 'languages';
const cacheHelperDeepFields_languages: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_LANGUAGES],
	},
])
export async function loadLanguageRemoteDict() {
	const collectionHelper = new CollectionHelper<Languages>(TABLE_NAME_LANGUAGES)
	const query = cacheHelperDeepFields_languages.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedLanguagesDict(): [ Record<string, Languages | null | undefined> | null | undefined, (callback: (currentValue: (Record<string, Languages | null | undefined> | null | undefined)) => Record<string, Languages | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Languages>(PersistentStore.languages);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoLanguagesDict()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceAsList = await loadLanguageRemoteDict();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'code')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_languages.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export function useSynchedLanguageByCode(code: string): Languages | undefined {
	const [resources, setResources, lastUpdate] = useSynchedLanguagesDict()
	return resources?.[code]
}

export function getDemoLanguagesDict(): Record<string, Languages> {
	return {
		[DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN]: {
			code: DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE_GERMAN,
			name: "German",
			direction: "ltr"
		},
		[DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE_ENGLISH]: {
			code: DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE_ENGLISH,
			name: "English",
			direction: "ltr"
		},
		"fr-FR": {
			code: "fr-FR",
			name: "French",
			direction: "ltr"
		},
		"es-ES": {
			code: "es-ES",
			name: "Spanish",
			direction: "ltr"
		},
		"it-IT": {
			code: "it-IT",
			name: "Italian",
			direction: "ltr"
		},
		"nl-NL": {
			code: "nl-NL",
			name: "Dutch",
			direction: "ltr"
		},
		"pl-PL": {
			code: "pl-PL",
			name: "Polish",
			direction: "ltr"
		},
		"pt-PT": {
			code: "pt-PT",
			name: "Portuguese",
			direction: "ltr"
		},
	}
}