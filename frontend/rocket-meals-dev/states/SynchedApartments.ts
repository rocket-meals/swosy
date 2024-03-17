import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Apartments} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoBuildings} from '@/states/SynchedBuildings';

async function loadApartmentsFromServer(): Promise<Apartments[]> {
	const collectionHelper = new CollectionHelper<Apartments>('apartments');

	const fields = ['*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export async function loadApartmentWithWashingMachinesFromServer(apartmentId: string): Promise<Apartments> {
	const collectionHelper = new CollectionHelper<Apartments>('apartments');

	const fields = ['*', "washingmachines.*"];

	const query = {
		limit: -1,
		fields: fields,
		filter: {
			id: apartmentId
		}
	}

	return await collectionHelper.readItem(apartmentId, query);
}

export function useSynchedApartmentsDict(): [(Record<string, Apartments> | undefined), ((newValue: Record<string, Apartments>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Apartments>(PersistentStore.apartments);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoApartments()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadApartmentsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly(resourceAsDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoApartments(): Record<string, Apartments> {
	const buildingsDict = getDemoBuildings()
	const demoBuildingsKeys = Object.keys(buildingsDict)
	const amountApartments = 500

	const demoResources: Record<string, Apartments> = {}
	for (let i = 0; i < amountApartments; i++) {
		const demoBuildingKey = demoBuildingsKeys[i%demoBuildingsKeys.length]
		const demoResource: Apartments = {
			id: i+'',
			washingmachines: [],
			building: demoBuildingKey
		}
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}