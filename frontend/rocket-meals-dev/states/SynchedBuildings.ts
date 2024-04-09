import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Apartments, Buildings, Businesshours, CanteensBusinesshours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {CoordinateHelper} from "@/helper/geo/CoordinateHelper";
import {LocationType} from "@/helper/geo/LocationType";
import {getDemoBusinesshoursDict, useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";

async function loadBuildingsFromServer(): Promise<Buildings[]> {
	const collectionHelper = new CollectionHelper<Buildings>('buildings');

	const fields = ['*','businesshours.*','translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedBuildingsDict(): [( Record<string, Buildings | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, Buildings | null | undefined> | null | undefined)) => Record<string, Buildings | null | undefined>, timestamp?: (number | undefined)) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Buildings>(PersistentStore.buildings);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoBuildings()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadBuildingsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoResource(index: number): Buildings {
	let languages = getDemoLanguagesDict();

	const name = 'Demo Building '+index

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			name: language.code+" - "+name,
			id: index,
			content: language.code,
			buildings_id: index+"",
			languages_code: language.code
		})
	}

	return {
		alias: name,
		apartments: [],
		id: index+'',
		status: '',
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
	const isDemo = useIsDemo()
	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	const [businesshoursDict, setBusinesshoursDict] = useSynchedBusinesshoursDict()
	const demoBusinesshoursDict = getDemoBusinesshoursDict()

	const canteensBusinesshoursDict: Record<string, Businesshours[] | undefined> = {}

	for (const buildingId in buildingsDict) {
		const building_id_as_string: string = buildingId
		const building = buildingsDict[buildingId]
		if (building?.businesshours) {
			let canteensBusinesshours: CanteensBusinesshours[] = building.businesshours as CanteensBusinesshours[]
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

			canteensBusinesshoursDict[building_id_as_string] = businesshours
		}
	}
	return canteensBusinesshoursDict

}