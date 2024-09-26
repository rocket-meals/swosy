import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {FoodsFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_FOODS_FEEDBACKS_LABELS = 'foods_feedbacks_labels';
const cacheHelperDeepFields_foodsFeedbacksLabels: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_FOODS_FEEDBACKS_LABELS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["foods_feedbacks_labels_translations"],
	}
], MyCacheHelperDeepFields.PUBLISHED_FILTER)
async function loadResourcesFromServer(): Promise<FoodsFeedbacksLabels[]> {
	const collectionHelper = new CollectionHelper<FoodsFeedbacksLabels>(TABLE_NAME_FOODS_FEEDBACKS_LABELS);
	const query = cacheHelperDeepFields_foodsFeedbacksLabels.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedFoodsFeedbacksLabelsDict(): [( Record<string, FoodsFeedbacksLabels | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, FoodsFeedbacksLabels | null | undefined> | null | undefined)) => Record<string, FoodsFeedbacksLabels | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsFeedbacksLabels>(PersistentStore.foodsFeedbacksLabels);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoodsFeedbacksLabelsDict()
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
		dependencies: cacheHelperDeepFields_foodsFeedbacksLabels.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getDemoResource(index: number, nameOfLabel: string, icon: string): FoodsFeedbacksLabels {
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
		icon: icon
	}
}

export function getDemoFoodsFeedbacksLabelsDict(): Record<string, FoodsFeedbacksLabels> {
	const demoResources: Record<string, FoodsFeedbacksLabels> = {}

	let names = ["Zu salzig", "Zu viel", "Lecker", "Herzhaft", "Süß", "Sauer", "Bitter", "Umami", "Fettig", "Trocken"]
	let icons = ["water", "check", "close", "book", "pause", "mail"]

	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		let icon = icons[i%icons.length];
		const demoResource = getDemoResource(i, name, icon)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}