import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Businesshours} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_BUSINESSHOURS = 'businesshours';
const cacheHelperDeepFields_businesshours: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_BUSINESSHOURS],
	},
])
async function loadBusinesshoursFromServer(): Promise<Businesshours[]> {
	const collectionHelper = new CollectionHelper<Businesshours>(TABLE_NAME_BUSINESSHOURS);
	const query = cacheHelperDeepFields_businesshours.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedBusinesshoursDict(): [(Record<string, Businesshours | null | undefined> | null | undefined), (callback: (currentValue: Record<string, Businesshours | null | undefined> | null | undefined) => Record<string, Businesshours | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Businesshours>(PersistentStore.businesshours);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoBusinesshoursDict()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const businesshoursList = await loadBusinesshoursFromServer()
		const businesshoursDict = CollectionHelper.convertListToDict(businesshoursList, 'id')
		setResourcesOnly((currentValue) => {
			return businesshoursDict;
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_businesshours.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export function getDemoBusinesshoursDict(): Record<string, Businesshours> {
	const resources: Record<string, Businesshours> = {
		"1": {
			valid_days: "",
			valid_range: "",
			"id": "1",
			time_start: "08:00:00",
			time_end: "15:00:00",
			monday: true,
		},
		"1.1": {
			valid_days: "",
			valid_range: "",
			"id": "1.1",
			time_start: "16:00:00",
			time_end: "20:00:00",
			monday: true,
		},
		"2": {
			valid_days: "",
			valid_range: "",
			"id": "2",
			date_valid_from: new Date().toISOString(), // from today until next week
			date_valid_till: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			time_start: "08:00:00",
			time_end: "16:00:00",
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: true,
		},
		"3": {
			valid_days: "",
			valid_range: "",
			"id": "3",
			time_start: "08:00:00",
			time_end: "16:00:00",
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: true,
		},
	};

	return resources
}