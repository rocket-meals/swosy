import { Markings} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';

async function loadMarkingsFromServer(): Promise<Markings[]> {
	const collectionHelper = new CollectionHelper<Markings>('markings');

	const fields = ['*','translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedMarkingsDict(): [(Record<string, Markings> | undefined), ((newValue: Record<string, Markings>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Markings>(PersistentStore.markings);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	const usedResources = resourcesOnly;
	if (demo) {
		//usedResources = getDemoBuildings()
	}

	async function updateFromServer(nowInMs?: number) {
		const markingsList = await loadMarkingsFromServer();
		const markingsDict = CollectionHelper.convertListToDict(markingsList, 'id')
		setResourcesOnly(markingsDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}