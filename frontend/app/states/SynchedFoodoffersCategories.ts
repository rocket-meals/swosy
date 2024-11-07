import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Foodoffers, FoodoffersCategories, Foods} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";

export const TABLE_NAME_FOODOFFERS_CATEGORIES = 'foodoffers_categories';
const cacheHelperDeepFields_FoodoffersCategories: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODOFFERS_CATEGORIES],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["foodoffers_categories_translations"],
	}
], MyCacheHelperDeepFields.PUBLISHED_FILTER)
async function loadResourcesFromServer(): Promise<FoodoffersCategories[]> {
	const collectionHelper = new CollectionHelper<FoodoffersCategories>(TABLE_NAME_FOODOFFERS_CATEGORIES);
	const query = cacheHelperDeepFields_FoodoffersCategories.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedFoodoffersCategoriesDict(): [( Record<string, FoodoffersCategories | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodoffersCategories | null | undefined> | null | undefined)) => Record<string, FoodoffersCategories | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodoffersCategories>(PersistentStore.foodoffers_categories_cache);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodoffersCategoriesDict()
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
		dependencies: cacheHelperDeepFields_FoodoffersCategories.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getDemoResource(index: number, nameOfLabel: string): FoodoffersCategories {
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

export function getDemoFoodoffersCategoriesDict(): Record<string, FoodoffersCategories> {
	const demoResources: Record<string, FoodoffersCategories> = {}

	let names = ["FLEISCH & MEER", "SÜSSE ECKE", "VEGGI & VEGAN"]

	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		const demoResource = getDemoResource(i, name)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}



export class FoodOfferCategoriesHelper {
	static getFoodofferCategoryName(foodofferCategory: string | FoodoffersCategories | null | undefined, languageCode: string) {
		if (typeof foodofferCategory === 'object' && foodofferCategory !== null) {
			let translations = foodofferCategory.translations as TranslationEntry[]
			if (translations) {
				let translation = getDirectusTranslation(languageCode, translations, 'name', false, foodofferCategory.alias, undefined);
				if (translation) {
					// capitalize first letter
					translation = translation.charAt(0).toUpperCase() + translation.slice(1);
					return translation;
				}
			}

			if (foodofferCategory?.alias) {
				// capitalize first letter
				return foodofferCategory.alias.charAt(0).toUpperCase() + foodofferCategory.alias.slice(1);
				//return food.alias
			}
		}
		return null;
	}

	static getFoodoffersFoodofferCategory(foodoffer: Foodoffers | undefined, foodoffersCategoriesDict: Record<string, FoodoffersCategories | null | undefined> | null | undefined) {
		const foodofferCategoryRaw = foodoffer?.foodoffer_category;
		let foodofferCategoryId = undefined;
		if(!!foodofferCategoryRaw){
			if(typeof foodofferCategoryRaw === 'string') {
				foodofferCategoryId = foodofferCategoryRaw;
			} else {
				foodofferCategoryId = foodofferCategoryRaw.id;
			}
		}
		if(!!foodofferCategoryId){
			return foodoffersCategoriesDict?.[foodofferCategoryId];
		}
		return null;
	}


	static sortFoodoffersByFoodofferCategory(foodoffers: Foodoffers[], foodoffersCategoriesDict: Record<string, FoodoffersCategories | null | undefined> | null | undefined, languageCode: string) {
		if(!foodoffersCategoriesDict){
			return foodoffers;
		}

		let sortedFoodoffers: Foodoffers[] = [];
		for(let i=0; i<foodoffers.length; i++){
			let foodoffer = foodoffers[i];
			sortedFoodoffers.push(foodoffer);
		}
		sortedFoodoffers.sort((foodofferA, foodofferB) => {
			let sort = FoodOfferCategoriesHelper.sortFoodoffersByFoodofferCategorySortOrder(foodofferA, foodofferB, foodoffersCategoriesDict);
			if(sort === 0){
				sort = FoodOfferCategoriesHelper.sortFoodoffersByFoodofferCategoryName(foodofferA, foodofferB, foodoffersCategoriesDict, languageCode);
			}
			return sort
		});
		return sortedFoodoffers;
	}

	static sortFoodoffersByFoodofferCategorySortOrder(foodofferA: Foodoffers, foodofferB: Foodoffers, foodoffersCategoriesDict: Record<string, FoodoffersCategories | null | undefined> | null | undefined){
		const foodofferCategoryA = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(foodofferA, foodoffersCategoriesDict);
		const sortOrderA = foodofferCategoryA?.sort
		const foodofferCategoryB = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(foodofferB, foodoffersCategoriesDict);
		const sortOrderB = foodofferCategoryB?.sort
		if(sortOrderA && sortOrderB){
			return sortOrderA - sortOrderB;
		}
		if(sortOrderA){
			// A should be before B
			return -1;
		}
		if(sortOrderB){
			// B should be before A
			return 1;
		}
		return 0;
	}

	static sortFoodoffersByFoodofferCategoryName(foodofferA: Foodoffers, foodofferB: Foodoffers, foodoffersCategoriesDict: Record<string, FoodoffersCategories | null | undefined> | null | undefined, languageCode: string){
		const foodofferCategoryA = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(foodofferA, foodoffersCategoriesDict);
		const foodofferCategoryB = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(foodofferB, foodoffersCategoriesDict);
		const nameA = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodofferCategoryA, languageCode);
		const nameB = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodofferCategoryB, languageCode);
		if(nameA && nameB){
			return nameA.localeCompare(nameB);
		}
		if(nameA){
			// A should be before B
			return -1;
		}
		if(nameB){
			// B should be before A
			return 1;
		}
		return 0;
	}
}

