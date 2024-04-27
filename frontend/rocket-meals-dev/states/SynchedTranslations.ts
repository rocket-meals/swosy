import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {AppTranslations} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_APP_TRANSLATIONS = 'app_translations';
const cacheHelperDeepFields_translations: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_APP_TRANSLATIONS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["app_translations_translations"],
	}
])
async function loadTranslationsFromServer(): Promise<AppTranslations[]> {
	const collectionHelper = new CollectionHelper<AppTranslations>(TABLE_NAME_APP_TRANSLATIONS);
	const query = cacheHelperDeepFields_translations.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedAppTranslationsDict(): [( Record<string, AppTranslations | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, AppTranslations | null | undefined> | null | undefined)) => Record<string, AppTranslations | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<AppTranslations>(PersistentStore.app_translations);
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceList = await loadTranslationsFromServer()
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentResouce => {
			return resourceDict
		}), sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_translations.getDependencies()
	}

	return [resourcesOnly, setResourcesOnly, cacheHelperObj]
}