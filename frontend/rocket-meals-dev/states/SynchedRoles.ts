import { DirectusRoles} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {ServerAPI} from '@/helper/database/server/ServerAPI';

export function useSynchedRolesDict(): [ Record<string, DirectusRoles | null | undefined> | null | undefined, ( (callback: (currentValue: (Record<string, DirectusRoles | null | undefined> | null | undefined)) => Record<string, DirectusRoles | null | undefined>, timestamp?: (number | undefined)) => void), number | undefined, (nowInMs?: number) => Promise<void>	] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<DirectusRoles>(PersistentStore.roles);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	const usedResources = resourcesOnly;
	if (demo) {
		//usedResources = getDemoBuildings()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceList = await ServerAPI.readRemoteRoles();
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceDict
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}