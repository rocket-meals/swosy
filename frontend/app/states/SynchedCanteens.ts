import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Businesshours, Canteens, CanteensFoodservicehours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup, TABLE_NAME_UTILIZATIONS_GROUPS} from '@/states/SynchedUtiliztations';
import {useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {getDemoBuildings} from "@/states/SynchedBuildings";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_CANTEENS = 'canteens';
const cacheHelperDeepFields_canteen: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_CANTEENS],
	},
	{
		field: 'foodservice_hours.*',
		limit: -1,
		dependency_collections_or_enum: ["canteens_foodservicehours"],
	},
	{
		field: 'utilization_group.*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_UTILIZATIONS_GROUPS],
	},
])
async function loadCanteensFromServer(): Promise<Canteens[]> {
	const collectionHelper = new CollectionHelper<Canteens>(TABLE_NAME_CANTEENS);
	const query = cacheHelperDeepFields_canteen.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedCanteensDict(): [( Record<string, Canteens | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, Canteens | null | undefined> | null | undefined)) => Record<string, Canteens | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Canteens>(PersistentStore.canteens);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoCanteens()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const canteensList = await loadCanteensFromServer()
		const canteensDict = CollectionHelper.convertListToDict(canteensList, 'id')
		setResourcesOnly((currentValue) => {
			return canteensDict;
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_canteen.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export function useSynchedCanteenById(canteen_id: string | undefined): Canteens | null | undefined{
	const [canteensDict, setCanteensDict] = useSynchedCanteensDict();
	if(!canteen_id){
		return null;
	}
	const foundCanteen = canteensDict?.[canteen_id];
	return foundCanteen;
}

function getDemoCanteens(): Record<string, Canteens> {
	const resources: Record<string, Canteens> = {};

	const buildingsDict = getDemoBuildings()
	const demoBuildingsKeys = Object.keys(buildingsDict)

	for (let i=0; i<100; i++) {
		let demo_building_id = demoBuildingsKeys[i % demoBuildingsKeys.length]
		let demoBuilding = buildingsDict[demo_building_id];

		const canteenId = 'demoCanteen'+(i)

		let foodservice_hours: CanteensFoodservicehours[] = [];
		let buildingsBusinesshours = demoBuilding.businesshours;
		if(!!buildingsBusinesshours){
			for(let buildingsBusinesshour of buildingsBusinesshours){
				foodservice_hours.push({
					businesshours_id: buildingsBusinesshour.businesshours_id,
					canteens_id: canteenId,
					id: buildingsBusinesshour.id
				})
			}
		}

		const demoResource: Canteens = {
			building: demo_building_id,
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: canteenId,
			alias: 'Demo Canteen '+(i),
			sort: undefined,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			foodservice_hours: foodservice_hours,
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
export function useSynchedCanteensFoodServicehoursDict(): Record<string, Businesshours[] | undefined>
 {
	 const isDemo = useIsDemo()
	 const [canteensDict, setCanteensDict] = useSynchedCanteensDict()
	 const [businesshoursDict, setBusinesshoursDict] = useSynchedBusinesshoursDict()

	 const canteensBusinesshoursDict: Record<string, Businesshours[] | undefined> = {}

	 for (const canteenId in canteensDict) {
		 const canteen_id_as_string: string = canteenId
		 const canteen = canteensDict[canteenId]
		 if (canteen?.foodservice_hours) {
			 let canteensBusinesshours: CanteensFoodservicehours[] = canteen.foodservice_hours as CanteensFoodservicehours[]
			 let businesshours: Businesshours[] = []
			 canteensBusinesshours.forEach((canteensBusinesshours) => {
				 let businesshoursId = canteensBusinesshours.businesshours_id
				 let businesshoursEntry = businesshoursDict?.[businesshoursId]
				 if (businesshoursEntry) {
					 businesshours.push(businesshoursEntry)
				 }
			 })

			 canteensBusinesshoursDict[canteen_id_as_string] = businesshours
		 }
	 }
	 return canteensBusinesshoursDict

}