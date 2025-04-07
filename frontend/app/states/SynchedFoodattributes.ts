import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	Businesshours,
	Canteens,
	CanteensFoodserviceHours,
	CanteensFoodserviceHoursDuringSemesterBreak, FoodsAttributes, FoodsAttributesGroups, FoodsAttributesValues
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup, TABLE_NAME_UTILIZATIONS_GROUPS} from '@/states/SynchedUtiliztations';
import {useSynchedBusinesshoursDict} from "@/states/SynchedBusinesshours";
import {getDemoResources} from "@/states/SynchedBuildings";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {getDemoFoodsAttributesGroups, TABLE_NAME_FOODS_ATTRIBUTES_GROUPS} from "@/states/SynchedFoodattributesGroups";

export const TABLE_NAME_FOODS_ATTRIBUTES = 'foods_attributes';
const cacheHelperDeepFields_foodsattributes: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODS_ATTRIBUTES],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["foods_attributes_translations"],
	},
	{
		field: 'group.*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODS_ATTRIBUTES_GROUPS],
	},
])
async function loadFoodattributesFromServer(): Promise<FoodsAttributes[]> {
	const collectionHelper = new CollectionHelper<FoodsAttributes>(TABLE_NAME_FOODS_ATTRIBUTES);
	const query = cacheHelperDeepFields_foodsattributes.getQuery()
	return await collectionHelper.readItems(query);
}

export type FoodAttributesDict =  Record<string, FoodsAttributes | null | undefined> | null | undefined;
export function useSynchedFoodsAttributesDict(): [( Record<string, FoodsAttributes | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodsAttributes | null | undefined> | null | undefined)) => Record<string, FoodsAttributes | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsAttributes>(PersistentStore.foodattributes);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodsAttributes()
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

export function useSynchedFoodsAttributeById(resource_id: string | undefined): FoodsAttributes | null | undefined{
	const [resourceDict, setResourceDict] = useSynchedFoodsAttributesDict();
	if(!resource_id){
		return null;
	}
	const foundResource = resourceDict?.[resource_id];
	return foundResource;
}

export function getDemoFoodsAttributesValues(): Record<string, FoodsAttributesValues> {
	const resources: Record<string, FoodsAttributesValues> = {};

	let foodsAttributes = getDemoFoodsAttributes();
	const AMOUNT_FOODS_ATTRIBUTES = Object.keys(foodsAttributes).length;

	for (let i=0; i<10; i++) {
		let number_value: number | undefined | null = i*0.3;
		let string_value: string | undefined | null = "Demo Food Attribute Value "+i;
		let boolean_value: boolean | undefined | null = i%2==0;
		if(i%3==0){
			number_value = undefined;
			string_value = undefined;
		} else if(i%3==1){
			string_value = undefined;
			boolean_value = undefined;
		} else if(i%3==2){
			number_value = undefined;
			boolean_value = undefined;
		}

		const demoResource: FoodsAttributesValues = {
			id: i+"",
			number_value: number_value,
			string_value: string_value,
			boolean_value: boolean_value,
			food_attribute: foodsAttributes[i%AMOUNT_FOODS_ATTRIBUTES+""] || null,
		}
		resources[demoResource.id] = demoResource;
	}

	return resources
}

export function getDemoFoodsAttributesValuesAsList(){
	const resources = getDemoFoodsAttributesValues();
	return Object.values(resources);
}

export function getDemoFoodsAttributes(): Record<string, FoodsAttributes> {
	const resources: Record<string, FoodsAttributes> = {};

	let foodsAttributesGroups = getDemoFoodsAttributesGroups();
	const AMOUNT_FOODS_ATTRIBUTES_GROUPS = Object.keys(foodsAttributesGroups).length;

	for (let i=0; i<10; i++) {
		const demoResource: FoodsAttributes = {
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: i+"",
			alias: 'Demo Food Attribute Group '+(i),
			sort: undefined,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			translations: [],
			group: foodsAttributesGroups[i%AMOUNT_FOODS_ATTRIBUTES_GROUPS+""] || null,
		}
		resources[demoResource.id] = demoResource;
	}

	return resources
}