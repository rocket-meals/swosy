import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	CanteensFeedbacksLabels,
	CanteensFeedbacksLabelsEntries, CanteensFeedbacksLabelsTranslations,
	FoodsFeedbacksLabels
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_CANTEENS_FEEDBACKS_LABELS = 'canteens_feedbacks_labels';
const cacheHelperDeepFields_canteensFeedbacksLabels: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_CANTEENS_FEEDBACKS_LABELS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["canteens_feedbacks_labels_translations"],
	}
], MyCacheHelperDeepFields.PUBLISHED_FILTER)
async function loadResourcesFromServer(): Promise<CanteensFeedbacksLabels[]> {
	const collectionHelper = new CollectionHelper<CanteensFeedbacksLabels>(TABLE_NAME_CANTEENS_FEEDBACKS_LABELS);
	const query = cacheHelperDeepFields_canteensFeedbacksLabels.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedCanteensFeedbacksLabelsListSortedAndFilteredByVisible(): CanteensFeedbacksLabels[] {
	const [feedbackLabelsDict] = useSynchedCanteensFeedbacksLabelsDict();
	let visibleFeedbackLabels: CanteensFeedbacksLabels[] = []
	for (let key in feedbackLabelsDict) {
		let feedbackLabel = feedbackLabelsDict[key]
		if (
			!!feedbackLabel
			//&& feedbackLabel.visible
		) {
			visibleFeedbackLabels.push(feedbackLabel)
		}
	}

	visibleFeedbackLabels.sort((a, b) => {
		return (a.sort ?? 0) - (b.sort ?? 0)
	})
	return visibleFeedbackLabels
}

export function useSynchedCanteensFeedbacksLabelsDict(): [( Record<string, CanteensFeedbacksLabels | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, CanteensFeedbacksLabels | null | undefined> | null | undefined)) => Record<string, CanteensFeedbacksLabels | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<CanteensFeedbacksLabels>(PersistentStore.canteensFeedbacksLabels);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoCanteensFeedbacksLabelsDict()
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
		dependencies: cacheHelperDeepFields_canteensFeedbacksLabels.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}


function getDemoResource(index: number, nameOfLabel: string, icon: string): CanteensFeedbacksLabels {
	let languages = getDemoLanguagesDict();

	const name = 'Demo '+nameOfLabel

	let translations: CanteensFeedbacksLabelsTranslations[] = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			text: language.code+" - "+name,
			id: index,
			canteens_feedbacks_labels_id: index+"",
			languages_code: language.code,
			translation_settings: ""
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

export function getDemoCanteensFeedbacksLabelsDict(): Record<string, CanteensFeedbacksLabels> {
	const demoResources: Record<string, FoodsFeedbacksLabels> = {}

	let names = ["Heute gab es etwas, dass mir schmeckte", "Heute hatte ich Zeit für die Mensa"]
	let icons = ["check", "pause"]

	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		let icon = icons[i%icons.length];
		const demoResource = getDemoResource(i, name, icon)
		demoResources[demoResource.id] = demoResource
	}

	return demoResources
}

function getDemoCanteensFeedbacksLabelsEntry(index: number): CanteensFeedbacksLabelsEntries {
	let feedbacksLabelsId = "demoFeedbacksLabelsId" + index
	let demoLabelsDict = getDemoCanteensFeedbacksLabelsDict();
	let demoLabelKeys = Object.keys(demoLabelsDict)
	let labelKey = demoLabelKeys[(index % demoLabelKeys.length)]
	let date_updated = new Date();
	// add 1 day for each feedback in the past
	date_updated.setDate(date_updated.getDate() - index);
	let date_updated_string = date_updated.toISOString();

	let like = index % 2 === 0

	return {
		status: "published",
		id: feedbacksLabelsId,
		like: like,
		label: labelKey,
		date_updated: date_updated_string,
		date_created: date_updated_string,
	}
}