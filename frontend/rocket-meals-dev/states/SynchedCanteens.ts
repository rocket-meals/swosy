import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Businesshours, Canteens, CanteensBusinesshours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup} from '@/states/SynchedUtiliztations';
import {getDemoBusinesshoursDict, useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {getDemoBuildings} from "@/states/SynchedBuildings";

async function loadCanteensFromServer(): Promise<Canteens[]> {
	const collectionHelper = new CollectionHelper<Canteens>('canteens');

	const fields = ['*', 'utilization_group.*', "businesshours.*"];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedCanteensDict(): [( Record<string, Canteens | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, Canteens | null | undefined> | null | undefined)) => Record<string, Canteens | null | undefined>, timestamp?: (number | undefined)) => void), (number | undefined), (nowInMs?: number) => Promise<void>] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Canteens>(PersistentStore.canteens);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoCanteens()
	}

	async function updateFromServer(nowInMs?: number) {
		const canteensList = await loadCanteensFromServer()
		const canteensDict = CollectionHelper.convertListToDict(canteensList, 'id')
		setResourcesOnly((currentValue) => {
			return canteensDict;
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoCanteens(): Record<string, Canteens> {
	const resources: Record<string, Canteens> = {};

	const buildingsDict = getDemoBuildings()
	const demoBuildingsKeys = Object.keys(buildingsDict)

	for (let i=0; i<100; i++) {
		let demo_building_id = demoBuildingsKeys[i % demoBuildingsKeys.length]

		const demoResource: Canteens = {
			building: demo_building_id,
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: 'demoCanteen'+(i),
			alias: 'Demo Canteen '+(i),
			sort: undefined,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			businesshours: [],
			utilization_group: getDemoUtilizationGroup()
		}
		resources[demoResource.id] = demoResource;
	}

	return resources
}


/**
 * Returns a dictionary of canteen businesshours
 * @returns Record<string, [Businesshours] | undefined> - canteen id to businesshours
 */
export function useSynchedCanteensBusinesshours(): Record<string, Businesshours[] | undefined>
 {
	 const isDemo = useIsDemo()
	 const [canteensDict, setCanteensDict] = useSynchedCanteensDict()
	 const [businesshoursDict, setBusinesshoursDict] = useSynchedBusinesshoursDict()
	 const demoBusinesshoursDict = getDemoBusinesshoursDict()

	 const canteensBusinesshoursDict: Record<string, Businesshours[] | undefined> = {}

	 for (const canteenId in canteensDict) {
		 const canteen_id_as_string: string = canteenId
		 const canteen = canteensDict[canteenId]
		 if (canteen.businesshours) {
			 let canteensBusinesshours: CanteensBusinesshours[] = canteen.businesshours as CanteensBusinesshours[]
			 let businesshours: Businesshours[] = []
			 if(isDemo) {
				 let demoKeys = Object.keys(demoBusinesshoursDict)
				 demoKeys.forEach((key) => {
					 businesshours.push(demoBusinesshoursDict[key])
				 })
			 } else {
				 canteensBusinesshours.forEach((canteensBusinesshours) => {
					 let businesshoursId = canteensBusinesshours.businesshours_id
					 let businesshoursEntry = businesshoursDict?.[businesshoursId]
					 if (businesshoursEntry) {
						 businesshours.push(businesshoursEntry)
					 }
				 })
			 }

			 canteensBusinesshoursDict[canteen_id_as_string] = businesshours
		 }
	 }
	 return canteensBusinesshoursDict

}