import { DirectusRoles} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {ServerAPI} from '@/helper/database/server/ServerAPI';
import {MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export function useSynchedRolesDict(): [ Record<string, DirectusRoles | null | undefined> | null | undefined, ( (callback: (currentValue: (Record<string, DirectusRoles | null | undefined> | null | undefined)) => Record<string, DirectusRoles | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<DirectusRoles>(PersistentStore.roles);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	const usedResources = resourcesOnly;
	if (demo) {
		//usedResources = getDemoBuildings()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceList = await ServerAPI.readRemoteRoles();
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: {
			collections: ["directus_roles"],
			update_always: true
		}
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}