import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Buildings} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';

async function loadBuildingsFromServer(): Promise<Buildings[]> {
	const collectionHelper = new CollectionHelper<Buildings>('buildings');

	const fields = ['*','translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedBuildingsDict(): [(Record<string, Buildings> | undefined), ((newValue: Record<string, Buildings>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Buildings>(PersistentStore.buildings);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoBuildings()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadBuildingsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly(resourceAsDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoResource(index: number): Buildings {
	return {
		canteens: [],
		alias: 'Demo Building '+index,
		apartments: [],
		id: index+'',
		status: '',
		translations: []
	}
}

export function getDemoBuildings(): Record<string, Buildings> {
	const demoResources: Record<string, Buildings> = {}
	for (let i = 0; i < 500; i++) {
		const demoResource = getDemoResource(i)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}