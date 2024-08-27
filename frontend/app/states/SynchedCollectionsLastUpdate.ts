import { CollectionsDatesLastUpdate} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_COLLECTIONS_DATES_LAST_UPDATE = 'collections_dates_last_update';
async function loadCollectionsDatesLastUpdateFromServer(): Promise<CollectionsDatesLastUpdate[]> {
	const collectionHelper = new CollectionHelper<CollectionsDatesLastUpdate>(TABLE_NAME_COLLECTIONS_DATES_LAST_UPDATE);

	const query = {
		limit: -1,
		fields: ['*'],
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedCollectionsDatesLastUpdateDict(): [Record<string, CollectionsDatesLastUpdate | null | undefined> | null | undefined, ((newValue: (currentValue: Record<string, CollectionsDatesLastUpdate | null | undefined> | null | undefined) => (Record<string, CollectionsDatesLastUpdate | null | undefined>)) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<CollectionsDatesLastUpdate>(PersistentStore.collections_dates_last_update);
	const demo = useIsDemo()
	const usedResources = resourcesOnly;
	if (demo) {
		//usedResources = getDemoBuildings()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceList = await loadCollectionsDatesLastUpdateFromServer();
		//console.log("useSynchedCollectionsDatesLastUpdateDict resourceList", resourceList);
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		//console.log("useSynchedCollectionsDatesLastUpdateDict resourceDict", resourceDict);
		setResourcesOnly((currentValue) => {
			//console.log("useSynchedCollectionsDatesLastUpdateDict currentValue", currentValue);
			//console.log("useSynchedCollectionsDatesLastUpdateDict save please", resourceDict);
			return resourceDict;
		}, sync_cache_composed_key_local);
	}


	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: resourcesRaw?.sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: {
			collections: [],
			update_always: true,
		}
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}