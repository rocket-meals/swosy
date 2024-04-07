import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {FoodsFeedbacks, FoodsFeedbacksFoodsFeedbacksLabels} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useCurrentUser} from '@/states/User';
import {useIsDemo} from "@/states/SynchedDemo";

export async function loadFoodFeedbacksRemoteByProfileId(id: string) {
	const resourceRelations = ['labels']
	const profileFields = resourceRelations.map(x => x+'.*').concat(['*']);

	const deepFields: Record<string, { _limit: number }> = resourceRelations.reduce((acc, x) => {
		acc[x] = { _limit: -1 };
		return acc;
	}, {} as Record<string, { _limit: number }>);

	const usersProfileId: string = id;
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>('foods_feedbacks')
	let query = {
		fields: profileFields,
		filter: {
			_and: [
				{
					profile: {
						_eq: usersProfileId
					}
				}
			]
		},
		deep: deepFields,
	}
	return await resourceCollectionHelper.readItems(query);
}

async function updateFoodFeedbackRemote(foodId: string, profile_id: string, foodIdToFoodFeedbackDict: Record<string, FoodsFeedbacks | undefined>, rating: number | null | undefined, comment: string | null | undefined, notify: boolean | null | undefined, foodFeedbackLabelIds: string[] | null | undefined) {
	const resourceCollectionHelper = new CollectionHelper<FoodsFeedbacks>('foods_feedbacks')

	let newFoodFeedback = {
		food: foodId,
		profile: profile_id,
		// @ts-ignore
		id: undefined,
	} as FoodsFeedbacks;

	let existingFoodFeedback = foodIdToFoodFeedbackDict[foodId] || newFoodFeedback;

	let existingId = existingFoodFeedback?.id;
	let isNewFeedback = !existingId

	if(rating !== undefined) {
		existingFoodFeedback.rating = rating;
	}
	if(comment !== undefined) {
		existingFoodFeedback.comment = comment;
	}
	if(notify !== undefined) {
		existingFoodFeedback.notify = notify;
	}
	if(foodFeedbackLabelIds !== undefined) {
		if(foodFeedbackLabelIds === null) {
			existingFoodFeedback.labels = []
		} else {
			let nextLabels: FoodsFeedbacksFoodsFeedbacksLabels[] = [];

			let existingLabels: FoodsFeedbacksFoodsFeedbacksLabels[] = existingFoodFeedback.labels || [];
			let existingLabelIds = existingLabels.map(x => x.foods_feedbacks_labels_id as string);

			let newLabelIds = foodFeedbackLabelIds.filter(x => !existingLabelIds.includes(x));
			let oldLabelIds = existingLabelIds.filter(x => foodFeedbackLabelIds.includes(x));

			// Add new labels
			for(let newLabelId of newLabelIds) {
				nextLabels.push({
					foods_feedbacks_labels_id: newLabelId,
					foods_feedbacks_id:existingFoodFeedback.id,
					// @ts-ignore
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

			existingFoodFeedback.labels = nextLabels
		}

	}

	const ratingIsNull = existingFoodFeedback.rating === null || existingFoodFeedback.rating === undefined;
	const commentIsNull = existingFoodFeedback.comment === null || existingFoodFeedback.comment === undefined;
	const notifyIsNull = existingFoodFeedback.notify === null || existingFoodFeedback.notify === undefined || existingFoodFeedback.notify === false;
	const labelsIsNull = existingFoodFeedback.labels === null || existingFoodFeedback.labels === undefined || existingFoodFeedback.labels.length === 0;

	const shouldDelete = ratingIsNull && commentIsNull && notifyIsNull && labelsIsNull;

	if(shouldDelete) {
		if(existingFoodFeedback.id) {
			await resourceCollectionHelper.deleteItem(existingFoodFeedback.id);
		}
	} else {
		if(isNewFeedback) {
			await resourceCollectionHelper.createItem(existingFoodFeedback);
		} else {
			await resourceCollectionHelper.updateItem(existingId, existingFoodFeedback);
		}
	}

}

export function useSynchedOwnFoodIdToFoodFeedbacksDict(): [ Record<string, FoodsFeedbacks | null | undefined> | null | undefined, (callback: (currentValue: (Record<string, FoodsFeedbacks | null | undefined> | null | undefined)) => Record<string, FoodsFeedbacks | null | undefined>, timestamp?: (number | undefined)) => void, number | null | undefined, (nowInMs?: number) => Promise<void>] {
	const [currentUser, setUserWithCache] = useCurrentUser();
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<FoodsFeedbacks | undefined>(PersistentStore.ownFoodFeedbacks);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly || {};
	if (demo) {
		//usedResources = getDemoApartments()
	}

	async function updateFromServer(nowInMs?: number) {
		console.log('updateFromServer: start',performance.now()/1000)
		if (currentUser) {
			const usersProfileId: string = currentUser.profile as unknown as string
			if (usersProfileId) {
				const resourceAsList = await loadFoodFeedbacksRemoteByProfileId(usersProfileId);
				const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'food')
				console.log("useSynchedOwnFoodIdToFoodFeedbacksDict: updateFromServer: loadFoodFeedbacksRemoteByProfileId: done: now setResourcesOnly ", performance.now()/1000)
				setResourcesOnly((currentValue) => {
					return resourceAsDict
				}, nowInMs)
			} else {
				console.log('User without profile')
				setResourcesOnly((currentValue) => {
					return {}
				}, nowInMs)
			}
		} else {
			console.log('No user')
			setResourcesOnly((currentValue) => {
				return {}
			}, nowInMs)
		}

	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

export function useSynchedOwnFoodFeedback(food_id: string): [FoodsFeedbacks | null | undefined, (rating: number | null | undefined) => Promise<void>, (comment: string | null | undefined) => Promise<void>, (notify: boolean | null | undefined) => Promise<void>, (foodFeedbackLabelIds: string[] | null | undefined) => Promise<void>] {
	const [foodFeedbacksDict, setFoodFeedbacksDict, lastUpdate, updateFromServer] = useSynchedOwnFoodIdToFoodFeedbacksDict();
	let usedResources = foodFeedbacksDict
	const [currentUser, setUserWithCache] = useCurrentUser();
	const usersProfileId: string = currentUser?.profile as unknown as string

	const foodFeedback = foodFeedbacksDict?.[food_id];

	const setOwnRating = async (rating: number | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, rating, undefined, undefined, undefined)
		await updateFromServer()
	}

	const setOwnComment = async (comment: string | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, comment, undefined, undefined)
		await updateFromServer()
	}

	const setOwnNotify = async (notify: boolean | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, undefined, notify, undefined)
		await updateFromServer()
	}

	const setOwnLabels = async (foodFeedbackLabelIds: string[] | null | undefined) => {
		await updateFoodFeedbackRemote(food_id, usersProfileId as unknown as string, usedResources, undefined, undefined, undefined, foodFeedbackLabelIds)
		await updateFromServer()
	}

	return [foodFeedback, setOwnRating, setOwnComment, setOwnNotify, setOwnLabels]
}