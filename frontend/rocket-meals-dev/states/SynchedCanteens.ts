import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Businesshours, Canteens, CanteensBusinesshours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup} from '@/states/SynchedUtiliztations';
import {getDemoBusinesshoursDict, useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";

async function loadCanteensFromServer(): Promise<Canteens[]> {
	const collectionHelper = new CollectionHelper<Canteens>('canteens');

	const fields = ['*', 'utilization_group.*', "businesshours.*"];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedCanteensDict(): [(Record<string, Canteens> | undefined), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoCanteens()
	}

	async function updateFromServer(nowInMs?: number) {
		const canteensList = await loadCanteensFromServer()
		const canteensDict = CollectionHelper.convertListToDict(canteensList, 'id')
		setResourcesOnly(canteensDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoCanteens(): Record<string, Canteens> {
	const resources: Record<string, Canteens> = {};

	for (let i=0; i<100; i++) {
		const demoResource: Canteens = {
			building: undefined,
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