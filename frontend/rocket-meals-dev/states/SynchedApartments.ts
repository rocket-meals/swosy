import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Apartments, Buildings, Washingmachines} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getBuildingLocationType, getDemoBuildings} from '@/states/SynchedBuildings';
import {LocationType} from "@/helper/geo/LocationType";
import {CoordinateHelper} from "@/helper/geo/CoordinateHelper";

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

export function useSynchedApartmentsDict(): [ Record<string, Apartments | null | undefined> | null | undefined, ((callback: (currentValue: (Record<string, Apartments | null | undefined> | null | undefined)) => Record<string, Apartments | null | undefined>, timestamp?: (number | undefined)) => void), number | null | undefined, (() => Promise<void>	)] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Apartments>(PersistentStore.apartments);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoApartments()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadApartmentsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

export function getApartmentLocationType(apartment: Apartments, buildingsDict: Record<string, Buildings> | undefined): LocationType | null {
	let buildingA = buildingsDict?.[apartment.building];
	return getBuildingLocationType(buildingA);
}

export function getDemoWashingmachines(): Washingmachines[] {
	const amountWashingmachines = 10
	const demoResources: Washingmachines[] = []

	for (let i = 0; i < amountWashingmachines; i++) {
		let date_finished: string | null | undefined = null;

		const date = new Date();
		if(i%2===1){
			// set in 2 minutes
			date.setMinutes(date.getMinutes() + (i));
		}
		date_finished = date.toISOString();
		const demoResource: Washingmachines = {
			id: i+'',
			alias: 'Washingmachine ' + i,
			date_finished: date_finished
		}
		demoResources.push(demoResource)
	}

	return demoResources


}

function getDemoApartments(): Record<string, Apartments> {
	const buildingsDict = getDemoBuildings()
	const demoBuildingsKeys = Object.keys(buildingsDict)
	const amountApartments = 500

	const demoResources: Record<string, Apartments> = {}

	let amountFreeApartments = 5
	let amountFreeApartmentsCounter = 0;
	for (let i = 0; i < amountApartments; i++) {
		const demoBuildingKey = demoBuildingsKeys[i%demoBuildingsKeys.length]
		let availableFrom = null;
		if(i%2===0 && amountFreeApartmentsCounter < amountFreeApartments){
			// add i days to the current date
			const date = new Date();
			date.setDate(date.getDate() + i*10);
			availableFrom = date.toISOString();
			amountFreeApartmentsCounter++;
		}
		const demoResource: Apartments = {
			id: i+'',
			washingmachines: [],
			available_from: availableFrom,
			building: demoBuildingKey
		}
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}