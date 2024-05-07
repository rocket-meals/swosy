import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Buildings, BuildingsBusinesshours, Businesshours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {CoordinateHelper} from "@/helper/geo/CoordinateHelper";
import {LocationType} from "@/helper/geo/LocationType";
import {getDemoBusinesshoursDict, useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_BUILDINGS = 'buildings';
const cacheHelperDeepFields_buildings: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_BUILDINGS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["buildings_translations"],
	},
	{
		field: 'businesshours.*',
		limit: -1,
		dependency_collections_or_enum: ["buildings_businesshours"],
	}
])
async function loadBuildingsFromServer(): Promise<Buildings[]> {
	const collectionHelper = new CollectionHelper<Buildings>(TABLE_NAME_BUILDINGS);
	const query = cacheHelperDeepFields_buildings.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedBuildingsDict(): [( Record<string, Buildings | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, Buildings | null | undefined> | null | undefined)) => Record<string, Buildings | null | undefined>, sync_cache_composed_key_local?: (string | undefined)) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Buildings>(PersistentStore.buildings);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoBuildings()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceAsList = await loadBuildingsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_buildings.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getDemoResource(index: number): Buildings {
	let languagesDict = getDemoLanguagesDict();

	const demoBusinesshoursDict = getDemoBusinesshoursDict()

	const name = 'Demo Building '+index

	let translations = []
	for (let languageKey in languagesDict) {
		let language = languagesDict[languageKey]
		translations.push({
			name: language.code+" - "+name,
			id: index,
			content: language.code,
			buildings_id: index+"",
			languages_code: language.code
		})
	}

	const building_id = "demoBuilding"+index;

	let businesshours: BuildingsBusinesshours[] = [];
	let demoKeys = Object.keys(demoBusinesshoursDict)
	demoKeys.forEach((key) => {
		businesshours.push({
			id: demoBusinesshoursDict[key].id+building_id,
			buildings_id: building_id,
			businesshours_id: demoBusinesshoursDict[key].id
		})
	})

	return {
		alias: name,
		apartments: [],
		id: building_id,
		status: '',
		businesshours: businesshours,
		coordinates: CoordinateHelper.getDemoDirectusCoordinates(index*0.01, index*0.01),
		translations: translations
	}
}

export function getBuildingLocationType(building: Buildings): LocationType | null {
	let coordinatesA = building?.coordinates;
	let locationA = CoordinateHelper.getLocation(coordinatesA);
	return locationA;
}

export function getDemoBuildings(): Record<string, Buildings> {
	const demoResources: Record<string, Buildings> = {}
	for (let i = 0; i < 500; i++) {
		const demoResource = getDemoResource(i)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}


/**
 * Returns a dictionary of canteen businesshours
 * @returns Record<string, [Businesshours] | undefined> - canteen id to businesshours
 */
export function useSynchedBuildingsBusinesshours(): Record<string, Businesshours[] | undefined>
{
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	const [businesshoursDict, setBusinesshoursDict] = useSynchedBusinesshoursDict()

	const buildingsBusinesshoursDict: Record<string, Businesshours[] | undefined> = {}

	for (const buildingId in buildingsDict) {
		const building_id_as_string: string = buildingId
		const building = buildingsDict[buildingId]
		if (building?.businesshours) {
			let buildingsBusinesshours: BuildingsBusinesshours[] = building.businesshours as BuildingsBusinesshours[]
			let businesshours: Businesshours[] = []
			buildingsBusinesshours.forEach((canteensBusinesshours) => {
				let businesshoursId = canteensBusinesshours.businesshours_id
				let businesshoursEntry = businesshoursDict?.[businesshoursId]
				if (businesshoursEntry) {
					businesshours.push(businesshoursEntry)
				}
			})
			buildingsBusinesshoursDict[building_id_as_string] = businesshours
		}
	}
	return buildingsBusinesshoursDict

}