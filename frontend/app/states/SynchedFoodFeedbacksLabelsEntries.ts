import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	FoodsFeedbacks,
	FoodsFeedbacksLabels,
	FoodsFeedbacksLabelsEntries
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useCurrentUser} from '@/states/User';
import {useIsDemo} from "@/states/SynchedDemo";
import {MyCacheHelperDeepFields, MyCacheHelperDependencyEnum, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {getDemoFoodsFeedbacksLabelsDict} from "@/states/SynchedFoodsFeedbacksLabels";

export const TABLE_NAME_FOODS_FEEDBACKS_LABELS_ENTRIES = 'foods_feedbacks_labels_entries';
const cacheHelperDeepFields_food_feedbacks: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum:  MyCacheHelperDependencyEnum.DOWNLOAD_ALWAYS // no dependencies as we will query our own profile
	},
])
export async function loadFoodFeedbacksLabelsEntriesRemoteByProfileId(id: string) {
	const usersProfileId: string = id;
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>(TABLE_NAME_FOODS_FEEDBACKS_LABELS_ENTRIES)
	let query = {
		fields: cacheHelperDeepFields_food_feedbacks.getFields(),
		filter: {
			_and: [
				{
					profile: {
						_eq: usersProfileId
					}
				}
			]
		},
		deep: cacheHelperDeepFields_food_feedbacks.getDeepFields(),
	}
	return await resourceCollectionHelper.readItems(query);
}

async function updateFoodFeedbackLabelEntryRemote(foodId: string, profile_id: string, foodIdToFoodFeedbackDict: Record<string, FoodsFeedbacksLabelsEntries[] | null | undefined> | null | undefined, foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null){
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>(TABLE_NAME_FOODS_FEEDBACKS_LABELS_ENTRIES)

	let foodFeedbackLabelEntries: FoodsFeedbacksLabelsEntries[] | null | undefined = foodIdToFoodFeedbackDict?.[foodId];

	let foodFeedbackLabelId = foodFeedbackLabel.id;
	let searchedFoodFeedbackLabelEntry = foodFeedbackLabelEntries?.find(x => x.label === foodFeedbackLabelId);

	let newFoodFeedbackLabelEntry: FoodsFeedbacksLabelsEntries = {
		food: foodId,
		label: foodFeedbackLabelId,
		dislike: dislike,
		profile: profile_id,
		// @ts-ignore
		id: undefined,
	} as unknown as FoodsFeedbacksLabelsEntries

	let isNewEntry = !searchedFoodFeedbackLabelEntry;
	let existingFoodFeedbackLabelEntry: FoodsFeedbacksLabelsEntries = searchedFoodFeedbackLabelEntry ? searchedFoodFeedbackLabelEntry : newFoodFeedbackLabelEntry
	if(isNewEntry) {
		let answer: FoodsFeedbacks = await resourceCollectionHelper.createItem(newFoodFeedbackLabelEntry) as FoodsFeedbacksLabelsEntries;
		console.log('updateFoodFeedbackRemote: createItem: answer', answer)
		existingFoodFeedbackLabelEntry = answer
	}

	console.log('updateFoodFeedbackRemote: existingFoodFeedbackLabelEntry', existingFoodFeedbackLabelEntry)

	if (!existingFoodFeedbackLabelEntry) {
		console.error('updateFoodFeedbackRemote: existingFoodFeedbackLabelEntry is undefined')
		return
	}

	existingFoodFeedbackLabelEntry.dislike = dislike;

	const dislikeIsNotSet = existingFoodFeedbackLabelEntry.dislike === null || existingFoodFeedbackLabelEntry.dislike === undefined;

	const shouldDelete = dislikeIsNotSet
	console.log('updateFoodFeedbackRemote: shouldDelete', shouldDelete)

	if(shouldDelete) {
		if(existingFoodFeedbackLabelEntry.id) {
			await resourceCollectionHelper.deleteItem(existingFoodFeedbackLabelEntry.id);
		}
	} else {
		console.log('updateFoodFeedbackLabelEntriesRemote: now updateItem with data', existingFoodFeedbackLabelEntry)
		await resourceCollectionHelper.updateItem(existingFoodFeedbackLabelEntry.id, existingFoodFeedbackLabelEntry);
	}

}

export function useSynchedOwnFoodIdToFoodFeedbacksLabelEntriesListDict(): [ Record<string, FoodsFeedbacksLabelsEntries[] | null | undefined> | null | undefined, (callback: (currentValue: (Record<string, FoodsFeedbacksLabelsEntries[] | null | undefined> | null | undefined)) => Record<string, FoodsFeedbacksLabelsEntries[] | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [currentUser, setUserWithCache] = useCurrentUser();
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsFeedbacksLabelsEntries[] | undefined>(PersistentStore.ownFoodFeedbacksLabelsEntries);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly || {};
	if (demo) {
		//usedResources = getDemoApartments()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		console.log('updateFromServer: start',performance.now()/1000)
		if (currentUser) {
			const usersProfileId: string = currentUser.profile as unknown as string
			if (usersProfileId) {
				const resourceAsList = await loadFoodFeedbacksLabelsEntriesRemoteByProfileId(usersProfileId);
				const resourceAsDict = CollectionHelper.convertListToDictWithListAsValue(resourceAsList, 'food')
				console.log("useSynchedOwnFoodIdToFoodFeedbacksDict: updateFromServer: loadFoodFeedbacksRemoteByProfileId: done: now setResourcesOnly ", performance.now()/1000)
				setResourcesOnly((currentValue) => {
					return resourceAsDict
				}, sync_cache_composed_key_local)
			} else {
				console.log('User without profile')
				setResourcesOnly((currentValue) => {
					return {}
				}, sync_cache_composed_key_local)
			}
		} else {
			console.log('No user')
			setResourcesOnly((currentValue) => {
				return {}
			}, sync_cache_composed_key_local)
		}
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_food_feedbacks.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getDemoFoodsFeedbacksLabelsEntry(index: number, foodId: string): FoodsFeedbacksLabelsEntries {
	let feedbacksLabelsId = "demoFeedbacksLabelsId" + index
	let demoLabelsDict = getDemoFoodsFeedbacksLabelsDict();
	let demoLabelKeys = Object.keys(demoLabelsDict)
	let labelKey = demoLabelKeys[(index % demoLabelKeys.length)]
	let date_updated = new Date();
	// add 1 day for each feedback in the past
	date_updated.setDate(date_updated.getDate() - index);
	let date_updated_string = date_updated.toISOString();

	let dislike = index % 2 === 0

	return {
		status: "published",
		id: feedbacksLabelsId,
		food: foodId,
		dislike: dislike,
		label: labelKey,
		date_updated: date_updated_string,
		date_created: date_updated_string,
	}
}

function getDemoFoodsFeedbacksLabelsEntries(foodId: string): FoodsFeedbacksLabelsEntries[] {
	let amountResources = 100;
	let demoFoodsFeedbacksLabelsEntries: FoodsFeedbacksLabelsEntries[] = []
	for (let i = 0; i < amountResources; i++) {
		demoFoodsFeedbacksLabelsEntries.push(getDemoFoodsFeedbacksLabelsEntry(i, foodId))
	}
	return demoFoodsFeedbacksLabelsEntries
}

export async function loadFoodsFeedbacksLabelsEntriesForFood(foodId: string, isDemo?: boolean): Promise<FoodsFeedbacksLabelsEntries[]> {
	if(isDemo) {
		return getDemoFoodsFeedbacksLabelsEntries(foodId)
	}

	let foodCollectionHelper = new CollectionHelper<FoodsFeedbacksLabelsEntries>(TABLE_NAME_FOODS_FEEDBACKS_LABELS_ENTRIES)

	// create a query which finds all labels for the given foodId
	let query = {
		fields: ["*"],
		filter: {
			_and: [
				{
					food: {
						_eq: foodId
					}
				}
			]
		}
	};

	console.log("loadFoodsFeedbacksLabelsEntriesForFood query", query)
	let foodsFeedbacksLabelsEntries = await foodCollectionHelper.readItems(query)
	return foodsFeedbacksLabelsEntries
}

export function getDictFoodFeedbackLabelsIdToAmount(foodFeedbackLabelsEntries: FoodsFeedbacksLabelsEntries[] | null | undefined): Record<string, {
	amount_likes: number,
	amount_dislikes: number,
} | undefined> {
	let feedbacksLabelsIdsCounted: Record<string, {
		amount_likes: number,
		amount_dislikes: number,
	}> = {}
	if(!!foodFeedbackLabelsEntries){
		for(let foodFeedbackLabelEntry of foodFeedbackLabelsEntries){
			let feedbacksLabelsId = foodFeedbackLabelEntry.label as string;
			if(!!feedbacksLabelsId){
				let dislike: boolean | undefined | null = foodFeedbackLabelEntry.dislike;
				let counted = feedbacksLabelsIdsCounted?.[feedbacksLabelsId] || {
					amount_likes: 0,
					amount_dislikes: 0,
				};
				if(dislike === true){
					counted.amount_dislikes++;
				} else if(dislike === false){
					counted.amount_likes++;
				} else {
					// skip if dislike is undefined or null
				}
				feedbacksLabelsIdsCounted[feedbacksLabelsId] = counted;
			}
		}
	}
	return feedbacksLabelsIdsCounted
}

/**
 * resourceAsDict: As key is the foodFeedbackLabelId and as value is the FoodsFeedbacksLabelsEntries
 * setOwnLabel: Function to set the own label for a food
 * @param food_id
 */
export function useSynchedOwnFoodFeedbackLabelEntries(food_id: string): [Record<any, FoodsFeedbacksLabelsEntries | null | undefined>, (foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null) => Promise<void>] {
	const [foodFeedbacksLabelsEntriesListDict, setFoodFeedbacksLabelsEntriesListDict, cacheHelperObj] = useSynchedOwnFoodIdToFoodFeedbacksLabelEntriesListDict();
	let usedResources = foodFeedbacksLabelsEntriesListDict
	const [currentUser, setUserWithCache] = useCurrentUser();
	const usersProfileId: string = currentUser?.profile as unknown as string

	console.log('useSynchedOwnFoodFeedbackLabelEntries: food_id', food_id)
	console.log("foodFeedbacksLabelsEntriesListDict", foodFeedbacksLabelsEntriesListDict)
	const foodFeedbackLabelEntriesList: FoodsFeedbacksLabelsEntries[] = foodFeedbacksLabelsEntriesListDict?.[food_id] || []

	const resourceAsDict = CollectionHelper.convertListToDict(foodFeedbackLabelEntriesList, 'label')


	const setOwnLabel = async (foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null) => {
		await updateFoodFeedbackLabelEntryRemote(food_id, usersProfileId as unknown as string, usedResources, foodFeedbackLabel, dislike)
		await cacheHelperObj.updateFromServer()
	}

	return [resourceAsDict, setOwnLabel]
}