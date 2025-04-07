import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {AppElements, Buildings, FoodsCategories} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_APP_ELEMENTS = 'app_elements';
const cacheHelperDeepFields_AppElements: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_APP_ELEMENTS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["app_elements_translations"],
	}
], MyCacheHelperDeepFields.PUBLISHED_FILTER)
async function loadResourcesFromServer(): Promise<AppElements[]> {
	const collectionHelper = new CollectionHelper<FoodsCategories>(TABLE_NAME_APP_ELEMENTS);
	const query = cacheHelperDeepFields_AppElements.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedAppElementsDict(): [( Record<string, AppElements | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, AppElements | null | undefined> | null | undefined)) => Record<string, AppElements | null | undefined>, sync_cache_composed_key_local?: (string | undefined)) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<AppElements>(PersistentStore.app_elements);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceAsList = await loadResourcesFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_AppElements.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}