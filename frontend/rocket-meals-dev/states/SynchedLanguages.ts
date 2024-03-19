import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Languages} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";

export async function loadLanguageRemoteDict() {
	const collectionHelper = new CollectionHelper<Languages>('languages')
	return await collectionHelper.readItems();
}

export function useSynchedLanguagesDict(): [(Record<string, Languages> | undefined), ((newValue: Record<string, Languages>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Languages>(PersistentStore.languages);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoLanguagesDict()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadLanguageRemoteDict();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'code')
		setResourcesOnly(resourceAsDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
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