import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	Businesshours,
	Canteens,
	CanteensFoodserviceHours,
	CanteensFoodserviceHoursDuringSemesterBreak, FoodsAttributes, FoodsAttributesGroups
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup, TABLE_NAME_UTILIZATIONS_GROUPS} from '@/states/SynchedUtiliztations';
import {useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {getDemoBuildings} from "@/states/SynchedBuildings";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_FOODS_ATTRIBUTES_GROUPS = 'foods_attributes_groups';
const cacheHelperDeepFields_foodsattributes: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODS_ATTRIBUTES_GROUPS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["foods_attributes_groups_translations"],
	},
])
async function loadFoodattributesFromServer(): Promise<FoodsAttributesGroups[]> {
	const collectionHelper = new CollectionHelper<FoodsAttributesGroups>(TABLE_NAME_FOODS_ATTRIBUTES_GROUPS);
	const query = cacheHelperDeepFields_foodsattributes.getQuery()
	return await collectionHelper.readItems(query);
}

export type FoodAttributesGroupsDict =  Record<string, FoodsAttributesGroups | null | undefined> | null | undefined;
export function useSynchedFoodsAttributesGroupsDict(): [( Record<string, FoodsAttributesGroups | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodsAttributesGroups | null | undefined> | null | undefined)) => Record<string, FoodsAttributesGroups | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsAttributesGroups>(PersistentStore.foodattributes_groups);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodsAttributesGroups()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceList = await loadFoodattributesFromServer()
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceDict;
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_foodsattributes.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export function useSynchedFoodsAttributeGroupById(resource_id: string | undefined): FoodsAttributesGroups | null | undefined{
	const [resourceDict, setResourceDict] = useSynchedFoodsAttributesGroupsDict();
	if(!resource_id){
		return null;
	}
	const foundResource = resourceDict?.[resource_id];
	return foundResource;
}

export function getDemoFoodsAttributesGroups(): Record<string, FoodsAttributesGroups> {
	const resources: Record<string, FoodsAttributes> = {};

	for (let i=0; i<3; i++) {
		const demoResource: FoodsAttributesGroups = {
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: i+"",
			alias: 'Demo Canteen '+(i),
			sort: undefined,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			translations: [],
		}
		resources[demoResource.id] = demoResource;
	}

	return resources
}