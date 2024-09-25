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

async function updateFoodFeedbackLabelEntryRemote(foodId: string, profile_id: string, foodIdToFoodFeedbackDict: Record<string, FoodsFeedbacksLabelsEntries[] | null | undefined> | null | undefined, foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null, canteen_id: string | null | undefined, foodoffer_id: string | null | undefined) {
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

	if(canteen_id) {
		existingFoodFeedbackLabelEntry.canteen = canteen_id
	}
	if(foodoffer_id) {
		existingFoodFeedbackLabelEntry.foodoffer = foodoffer_id
	}

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

export type FoodFeedbacksLabelsCountsType = Record<string, { amount_likes: number, amount_dislikes: number }>
export async function loadFoodsFeedbacksLabelsCountsForFood(foodId: string, visibleLabels: string[]): Promise<FoodFeedbacksLabelsCountsType> {
	console.log("--> loadFoodsFeedbacksLabelsCountsForFood", foodId, visibleLabels);
	let foodCollectionHelper = new CollectionHelper<FoodsFeedbacksLabelsEntries>(TABLE_NAME_FOODS_FEEDBACKS_LABELS_ENTRIES);

	let result: Record<string, { amount_likes: number, amount_dislikes: number }> = {};

	for(let visibleLabel of visibleLabels) {
		console.log("visibleLabel", visibleLabel);
		// Create a query that counts entries for each visible feedback label for the given foodId
		const defaultQuery = {
			aggregate: {
				count: "*"
			},
			groupBy: ['dislike'], // Groups by the dislike field (true/false)
			query: {
				filter: {
					_and: [
						{
							food: {
								_eq: foodId
							}
						},
						{
							label: {
								_eq: visibleLabel
							}
						},
					]
				},
			}
		};

		/** result example:
		 * [
		 *   {
		 *     "dislike": false,
		 *     "count": "1"
		 *   },
		 *   {
		 *     "dislike": true,
		 *     "count": "1"
		 *   }
		 * ]
		 */

		type resultType = {
			dislike: boolean,
			count: number,
		}

		let resultForLikes: resultType[] = await foodCollectionHelper.aggregateItems(defaultQuery);
		let amount_likes = 0;
		let amount_dislikes = 0;
		for(let resultItem of resultForLikes) {
			if(!resultItem.dislike) {
				amount_likes = resultItem.count;
			} else if(resultItem.dislike) {
				amount_dislikes = resultItem.count;
			}
		}
		result[visibleLabel] = {
			amount_likes: amount_likes,
			amount_dislikes: amount_dislikes,
		}

		console.log("-- resultForLikes", resultForLikes);
	}

	console.log("loadFoodsFeedbacksLabelsCountsForFood result", result);

	return result;
}

/**
 * resourceAsDict: As key is the foodFeedbackLabelId and as value is the FoodsFeedbacksLabelsEntries
 * setOwnLabel: Function to set the own label for a food
 * @param food_id
 * @param canteen_id
 * @param foodoffer_id
 */
export function useSynchedOwnFoodFeedbackLabelEntries(food_id: string, canteen_id?: string, foodoffer_id?: string): [Record<any, FoodsFeedbacksLabelsEntries | null | undefined>, (foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null) => Promise<void>] {
	const [foodFeedbacksLabelsEntriesListDict, setFoodFeedbacksLabelsEntriesListDict, cacheHelperObj] = useSynchedOwnFoodIdToFoodFeedbacksLabelEntriesListDict();
	let usedResources = foodFeedbacksLabelsEntriesListDict
	const [currentUser, setUserWithCache] = useCurrentUser();
	const usersProfileId: string = currentUser?.profile as unknown as string

	const foodFeedbackLabelEntriesList: FoodsFeedbacksLabelsEntries[] = foodFeedbacksLabelsEntriesListDict?.[food_id] || []

	const resourceAsDict = CollectionHelper.convertListToDict(foodFeedbackLabelEntriesList, 'label')


	const setOwnLabel = async (foodFeedbackLabel: FoodsFeedbacksLabels, dislike: boolean | null) => {
		await updateFoodFeedbackLabelEntryRemote(food_id, usersProfileId as unknown as string, usedResources, foodFeedbackLabel, dislike, canteen_id, foodoffer_id)
		await cacheHelperObj.updateFromServer()
	}

	return [resourceAsDict, setOwnLabel]
}