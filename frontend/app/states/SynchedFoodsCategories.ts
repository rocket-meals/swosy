import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Foodoffers, FoodoffersCategories, Foods, FoodsCategories} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";

export const TABLE_NAME_FOODS_CATEGORIES = 'foods_categories';
const cacheHelperDeepFields_FoodsCategories: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODS_CATEGORIES],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["foods_categories_translations"],
	}
], MyCacheHelperDeepFields.PUBLISHED_FILTER)
async function loadResourcesFromServer(): Promise<FoodsCategories[]> {
	const collectionHelper = new CollectionHelper<FoodsCategories>(TABLE_NAME_FOODS_CATEGORIES);
	const query = cacheHelperDeepFields_FoodsCategories.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedFoodsCategoriesDict(): [( Record<string, FoodsCategories | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodsCategories | null | undefined> | null | undefined)) => Record<string, FoodsCategories | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsCategories>(PersistentStore.foods_categories_cache);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodsCategoriesDict()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceAsList = await loadResourcesFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_FoodsCategories.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getDemoResource(index: number, nameOfLabel: string): FoodsCategories {
	let languages = getDemoLanguagesDict();

	const name = 'Demo '+nameOfLabel

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			text: language.code+" - "+name,
			id: index,
			content: language.code,
			foods_feedbacks_labels_id: index+"",
			languages_code: language.code
		})
	}

	return {
		alias: name,
		id: index+'',
		status: '',
		translations: translations,
	}
}

export function getDemoFoodsCategoriesDict(): Record<string, FoodsCategories> {
	const demoResources: Record<string, FoodsCategories> = {}

	let names = ["Hauptgericht", "Beilage", "Dessert", "Salat"]

	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		const demoResource = getDemoResource(i, name)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}


export class FoodsCategoriesHelper {
	static getFoodCategoryName(foodCategory: string | FoodsCategories | null | undefined, languageCode: string) {
		if (typeof foodCategory === 'object' && foodCategory !== null) {
			let translations = foodCategory.translations as TranslationEntry[]
			if (translations) {
				let translation = getDirectusTranslation(languageCode, translations, 'name', false, foodCategory.alias, undefined);
				if (translation) {
					// capitalize first letter
					translation = translation.charAt(0).toUpperCase() + translation.slice(1);
					return translation;
				}
			}

			if (foodCategory?.alias) {
				// capitalize first letter
				return foodCategory.alias.charAt(0).toUpperCase() + foodCategory.alias.slice(1);
				//return food.alias
			}
		}
		return null;
	}


	static getFoodsFoodsCategory(foodoffer: Foods | undefined, foodsCategoriesDict: Record<string, FoodsCategories | null | undefined> | null | undefined) {
		const foodofferCategoryRaw = foodoffer?.food_category;
		let foodofferCategoryId = undefined;
		if(!!foodofferCategoryRaw){
			if(typeof foodofferCategoryRaw === 'string') {
				foodofferCategoryId = foodofferCategoryRaw;
			} else {
				foodofferCategoryId = foodofferCategoryRaw.id;
			}
		}
		if(!!foodofferCategoryId){
			return foodsCategoriesDict?.[foodofferCategoryId];
		}
		return null;
	}
}
