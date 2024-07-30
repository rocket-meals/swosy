import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {FoodsFeedbacks, FoodsFeedbacksFoodsFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useCurrentUser} from '@/states/User';
import {useIsDemo} from "@/states/SynchedDemo";
import {MyCacheHelperDeepFields, MyCacheHelperDependencyEnum, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {TABLE_NAME_BUILDINGS} from "@/states/SynchedBuildings";

export const TABLE_NAME_FOODS_FEEDBACKS = 'foods_feedbacks';
const cacheHelperDeepFields_food_feedbacks: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum:  MyCacheHelperDependencyEnum.DOWNLOAD_ALWAYS // no dependencies as we will query our own profile
	},
	{
		field: 'labels.*',
		limit: -1,
		// FoodsFeedbacksFoodsFeedbacksLabels
		dependency_collections_or_enum: MyCacheHelperDependencyEnum.DOWNLOAD_ALWAYS
	},
])
export async function loadFoodFeedbacksRemoteByProfileId(id: string) {
	const usersProfileId: string = id;
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>(TABLE_NAME_FOODS_FEEDBACKS)
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

async function updateFoodFeedbackRemote(foodId: string, profile_id: string, foodIdToFoodFeedbackDict: Record<string, FoodsFeedbacks | undefined>, rating: number | null | undefined, comment: string | null | undefined, notify: boolean | null | undefined, foodFeedbackLabelIds: FoodsFeedbacksFoodsFeedbacksLabels[] | null | undefined) {
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>(TABLE_NAME_FOODS_FEEDBACKS)

	let searchedFoodFeedback: FoodsFeedbacks | undefined = foodIdToFoodFeedbackDict[foodId];

	let searchedId = searchedFoodFeedback?.id;
	let isNewFeedback = !searchedId

	let existingFoodFeedback = searchedFoodFeedback;
	if(isNewFeedback || !searchedFoodFeedback) {
		let newFoodFeedback: FoodsFeedbacks = {
			food: foodId,
			profile: profile_id,
			// @ts-ignore
			id: undefined,
		}
		let answer: FoodsFeedbacks = await resourceCollectionHelper.createItem(newFoodFeedback) as FoodsFeedbacks;
		console.log('updateFoodFeedbackRemote: createItem: answer', answer)
		existingFoodFeedback = answer;
	}

	console.log('updateFoodFeedbackRemote: existingFoodFeedback', existingFoodFeedback)

	if (!existingFoodFeedback) {
		console.error('updateFoodFeedbackRemote: existingFoodFeedback is undefined')
		return
	}

	if(rating !== undefined) {
		existingFoodFeedback.rating = rating;
	}
	if(comment !== undefined) {
		existingFoodFeedback.comment = comment;
	}
	if(notify !== undefined) {
		existingFoodFeedback.notify = notify;
	}

	let ignoreLabels = false;
	//if(foodFeedbackLabelIds !== undefined) {
		if(foodFeedbackLabelIds === null) {
			existingFoodFeedback.labels = []
		} if(foodFeedbackLabelIds === undefined) {
			console.log('updateFoodFeedbackRemote: foodFeedbackLabelIds is undefined, the existing labels are')
			console.log(existingFoodFeedback.labels)
			existingFoodFeedback.labels = undefined
			ignoreLabels = true;
		} else {
			let nextLabels: FoodsFeedbacksFoodsFeedbacksLabels[] = [];

			let existingLabels: FoodsFeedbacksFoodsFeedbacksLabels[] = existingFoodFeedback.labels || [];
			let existingLabelIds = existingLabels.map(x => x.foods_feedbacks_labels_id as string);

			let newLabelIds = foodFeedbackLabelIds.filter(x => !existingLabelIds.includes(x));
			let oldLabelIds = existingLabelIds.filter(x => foodFeedbackLabelIds.includes(x));

			// Add new labels
			for(let newLabelId of newLabelIds) {
				nextLabels.push({
					foods_feedbacks_labels_id: newLabelId.foods_feedbacks_labels_id,
					foods_feedbacks_id: existingFoodFeedback.id,
					dislike: newLabelId.dislike,
					// @ts-ignore the id will be set by the server
					id: undefined
				})
			}

			// Add old labels
			for(let oldLabelId of oldLabelIds) {
				let existingLabel = existingLabels.find(x => x.foods_feedbacks_labels_id === oldLabelId);
				if(existingLabel) {
					nextLabels.push(existingLabel);
				}
			}

			console.log('updateFoodFeedbackRemote: nextLabels', nextLabels)

			existingFoodFeedback.labels = nextLabels
		}

	//}

	const ratingIsNull = existingFoodFeedback.rating === null || existingFoodFeedback.rating === undefined;
		console.log('updateFoodFeedbackRemote: ratingIsNull', ratingIsNull)
	const commentIsNull = existingFoodFeedback.comment === null || existingFoodFeedback.comment === undefined;
		console.log('updateFoodFeedbackRemote: commentIsNull', commentIsNull)
	const notifyIsNull = existingFoodFeedback.notify === null || existingFoodFeedback.notify === undefined || existingFoodFeedback.notify === false;
		console.log('updateFoodFeedbackRemote: notifyIsNull', notifyIsNull)
	let labelsIsNull = !ignoreLabels && (existingFoodFeedback.labels === null || existingFoodFeedback.labels === undefined || existingFoodFeedback.labels.length === 0);
		console.log('updateFoodFeedbackRemote: labelsIsNull', labelsIsNull)

	const shouldDelete = ratingIsNull && commentIsNull && notifyIsNull && labelsIsNull;
	console.log('updateFoodFeedbackRemote: shouldDelete', shouldDelete)

	if(shouldDelete) {
		if(existingFoodFeedback.id) {
			await resourceCollectionHelper.deleteItem(existingFoodFeedback.id);
		}
	} else {
		console.log('updateFoodFeedbackRemote: now updateItem with data', existingFoodFeedback)
		await resourceCollectionHelper.updateItem(existingFoodFeedback.id, existingFoodFeedback);
	}

}

export function useSynchedOwnFoodIdToFoodFeedbacksDict(): [ Record<string, FoodsFeedbacks | null | undefined> | null | undefined, (callback: (currentValue: (Record<string, FoodsFeedbacks | null | undefined> | null | undefined)) => Record<string, FoodsFeedbacks | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [currentUser, setUserWithCache] = useCurrentUser();
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsFeedbacks | undefined>(PersistentStore.ownFoodFeedbacks);
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
				const resourceAsList = await loadFoodFeedbacksRemoteByProfileId(usersProfileId);
				const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'food')
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

export function useSynchedOwnFoodFeedback(food_id: string): [FoodsFeedbacks | null | undefined, (rating: number | null | undefined) => Promise<void>, (comment: string | null | undefined) => Promise<void>, (notify: boolean | null | undefined) => Promise<void>, (foodFeedbackLabelIds: FoodsFeedbacksFoodsFeedbacksLabels[] | null | undefined) => Promise<void>] {
	const [foodFeedbacksDict, setFoodFeedbacksDict, cacheHelperObj] = useSynchedOwnFoodIdToFoodFeedbacksDict();
	let usedResources = foodFeedbacksDict
	const [currentUser, setUserWithCache] = useCurrentUser();
	const usersProfileId: string = currentUser?.profile as unknown as string

	const foodFeedback = foodFeedbacksDict?.[food_id];

	const setOwnRating = async (rating: number | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, rating, undefined, undefined, undefined)
		await cacheHelperObj.updateFromServer()
	}

	const setOwnComment = async (comment: string | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, comment, undefined, undefined)
		await cacheHelperObj.updateFromServer()
	}

	const setOwnNotify = async (notify: boolean | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, undefined, notify, undefined)
		await cacheHelperObj.updateFromServer()
	}

	const setOwnLabels = async (foodFeedbackLabelIds: FoodsFeedbacksFoodsFeedbacksLabels[] | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, undefined, undefined, foodFeedbackLabelIds)
		await cacheHelperObj.updateFromServer()
	}

	return [foodFeedback, setOwnRating, setOwnComment, setOwnNotify, setOwnLabels]
}