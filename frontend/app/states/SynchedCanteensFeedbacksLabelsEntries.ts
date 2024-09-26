import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	Canteens,
	CanteensFeedbacksLabels,
	CanteensFeedbacksLabelsEntries,
	FoodsFeedbacksLabels
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useCurrentUser} from '@/states/User';
import {useIsDemo} from "@/states/SynchedDemo";
import {MyCacheHelperDeepFields, MyCacheHelperDependencyEnum, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {useEffect, useState} from "react";
import {DateHelper} from "@/helper/date/DateHelper";
import {ItemStatus} from "@/helper/database/ItemStatus";

export const TABLE_NAME_CANTEENS_FEEDBACKS_LABELS_ENTRIES = 'canteens_feedbacks_labels_entries';
const cacheHelperDeepFields_canteen_feedbacks: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum:  MyCacheHelperDependencyEnum.DOWNLOAD_ALWAYS // no dependencies as we will query our own profile
	},
])
export async function loadCanteenFeedbacksLabelsEntriesRemoteByProfileId(id: string) {
	const usersProfileId: string = id;
	const resourceCollectionHelper = new CollectionHelper<CanteensFeedbacksLabelsEntries>(TABLE_NAME_CANTEENS_FEEDBACKS_LABELS_ENTRIES)
	let query = {
		fields: cacheHelperDeepFields_canteen_feedbacks.getFields(),
		filter: {
			_and: [
				{
					profile: {
						_eq: usersProfileId
					}
				}
			]
		},
		deep: cacheHelperDeepFields_canteen_feedbacks.getDeepFields(),
	}
	return await resourceCollectionHelper.readItems(query);
}

function getKeyForCanteenFeedbackLabelEntry(canteenId: string, dateAsIsoString: string, label: string): string {
	const date = new Date(dateAsIsoString)
	const directus_date_only_string = DateHelper.getDirectusDateOnlyString(date)

	return canteenId + "-" + directus_date_only_string + "-" + label
}

function getKeyForCanteenFeedbackLabelEntryFromObject(entry: CanteensFeedbacksLabelsEntries): string {
	return getKeyForCanteenFeedbackLabelEntry(entry.canteen as string, entry.date as string, entry.label as string)
}

async function updateCanteenFeedbackLabelEntryRemote(profile_id: string, dictToCanteenFeedbackLabelEntries: Record<string, CanteensFeedbacksLabelsEntries | null | undefined> | null | undefined, canteenFeedbackLabel: CanteensFeedbacksLabels, dislike: boolean | null, canteen: Canteens, directus_date_only_string: string) {
	const resourceCollectionHelper = new CollectionHelper<CanteensFeedbacksLabelsEntries>(TABLE_NAME_CANTEENS_FEEDBACKS_LABELS_ENTRIES)
	console.log('updateFeedbackRemote: start')
	console.log("profile_id", profile_id)
	console.log("canteenFeedbackLabel", canteenFeedbackLabel)
	console.log("dislike", dislike)
	console.log("canteen", canteen)
	console.log("directus_date_only_string", directus_date_only_string)

	let canteenFeedbackLabelId = canteenFeedbackLabel.id;
	let key = getKeyForCanteenFeedbackLabelEntry(canteen.id, directus_date_only_string, canteenFeedbackLabelId);

	let searchedFeedbackLabelEntry = dictToCanteenFeedbackLabelEntries?.[key];

	let newFeedbackLabelEntry: Partial<CanteensFeedbacksLabelsEntries> = {
		canteen: canteen.id,
		label: canteenFeedbackLabelId,
		date: directus_date_only_string,
		status: ItemStatus.PUBLISHED,
		dislike: dislike,
		profile: profile_id,
		// @ts-ignore
		id: undefined,
	}

	let isNewEntry = !searchedFeedbackLabelEntry;
	console.log('updateFeedbackRemote: isNewEntry', isNewEntry)
	let existingFeedbackLabelEntry: CanteensFeedbacksLabelsEntries | null = searchedFeedbackLabelEntry ? searchedFeedbackLabelEntry : null
	if(isNewEntry) {
		let answer: CanteensFeedbacksLabelsEntries = await resourceCollectionHelper.createItem(newFeedbackLabelEntry);
		console.log('updateFeedbackRemote: createItem: answer', answer)
		existingFeedbackLabelEntry = answer
	}

	console.log('updateFeedbackRemote: existingFeedbackLabelEntry', existingFeedbackLabelEntry)

	if (!existingFeedbackLabelEntry) {
		console.error('updateFeedbackRemote: existingFeedbackLabelEntry is undefined')
		return
	}

	existingFeedbackLabelEntry.dislike = dislike;

	const dislikeIsNotSet = existingFeedbackLabelEntry.dislike === null || existingFeedbackLabelEntry.dislike === undefined;

	const shouldDelete = dislikeIsNotSet
	console.log('updateFeedbackRemote: shouldDelete', shouldDelete)

	if(canteen) {
		existingFeedbackLabelEntry.canteen = canteen.id;
	}
	delete existingFeedbackLabelEntry.user_created;
	delete existingFeedbackLabelEntry.user_updated;

	if(shouldDelete) {
		if(existingFeedbackLabelEntry.id) {
			await resourceCollectionHelper.deleteItem(existingFeedbackLabelEntry.id);
		}
	} else {
		console.log('updateFeedbackLabelEntriesRemote: now updateItem with data', existingFeedbackLabelEntry)
		await resourceCollectionHelper.updateItem(existingFeedbackLabelEntry.id, existingFeedbackLabelEntry);
	}

}

export function useSynchedOwnDictToCanteensFeedbacksLabelEntriesListDict(): [ Record<string, CanteensFeedbacksLabelsEntries | null | undefined> | null | undefined, (callback: (currentValue: (Record<string, CanteensFeedbacksLabelsEntries | null | undefined> | null | undefined)) => Record<string, CanteensFeedbacksLabelsEntries | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [currentUser, setUserWithCache] = useCurrentUser();
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<CanteensFeedbacksLabelsEntries | undefined>(PersistentStore.ownCanteenFeedbacksLabelsEntries);
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
				const resourceAsList = await loadCanteenFeedbacksLabelsEntriesRemoteByProfileId(usersProfileId);
				const resourceAsDict: Record<string, CanteensFeedbacksLabelsEntries> = {}
				for (let resource of resourceAsList) {
					let key = getKeyForCanteenFeedbackLabelEntryFromObject(resource)
					resourceAsDict[key] = resource
				}
				console.log("useSynchedOwnDictToCanteensFeedbacksLabelEntriesListDict: updateFromServer: loadFeedbacksRemoteByProfileId: done: now setResourcesOnly ", performance.now()/1000)
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
		dependencies: cacheHelperDeepFields_canteen_feedbacks.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

export type CanteenFeedbacksLabelsCountsType = { amount_likes: number, amount_dislikes: number }
export function useLoadCanteensFeedbacksLabelsCountsForCanteen(canteenId: string, label: CanteensFeedbacksLabels, directus_date_string: string, additional_dependency_key: string): CanteenFeedbacksLabelsCountsType {
	type resultType = {
		dislike: boolean,
		count: number,
	}
	const [result, setResult] = useState<CanteenFeedbacksLabelsCountsType>({ amount_likes: 0, amount_dislikes: 0 });

	async function load(){
		let foodCollectionHelper = new CollectionHelper<CanteensFeedbacksLabelsEntries>(TABLE_NAME_CANTEENS_FEEDBACKS_LABELS_ENTRIES);

		const defaultQuery = {
			aggregate: {
				count: "*"
			},
			groupBy: ['dislike'], // Groups by the dislike field (true/false)
			query: {
				filter: {
					_and: [
						{
							date: {
								_eq: directus_date_string
							}
						},
						{
							canteen: {
								_eq: canteenId
							}
						},
						{
							label: {
								_eq: label.id
							}
						},
					]
				},
			}
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
		setResult({ amount_likes: amount_likes, amount_dislikes: amount_dislikes });
	}

	useEffect(() => {
		load()
	}, [canteenId, label, directus_date_string, additional_dependency_key]);

	return result
}

/**
 * resourceAsDict: As key is the foodFeedbackLabelId and as value is the CanteensFeedbacksLabelsEntries
 * setOwnLabel: Function to set the own label for a food
 * @param food_id
 * @param canteen_id
 * @param foodoffer_id
 */
export function useSynchedOwnCanteenFeedbackLabelEntry(canteen: Canteens, dateAsIsoString: string, feedbackLabel: CanteensFeedbacksLabels): [CanteensFeedbacksLabelsEntries | null | undefined, (dislike: boolean | null) => Promise<void>] {
	const [foodFeedbacksLabelsEntriesListDict, setFoodFeedbacksLabelsEntriesListDict, cacheHelperObj] = useSynchedOwnDictToCanteensFeedbacksLabelEntriesListDict();
	let usedResources = foodFeedbacksLabelsEntriesListDict
	const [currentUser, setUserWithCache] = useCurrentUser();
	const usersProfileId: string = currentUser?.profile as unknown as string

	const key = getKeyForCanteenFeedbackLabelEntry(canteen.id, dateAsIsoString, feedbackLabel.id)
	const resource = usedResources?.[key] || null

	const setDislike = async (dislike: boolean | null) => {
		await updateCanteenFeedbackLabelEntryRemote(usersProfileId as unknown as string, usedResources, feedbackLabel, dislike, canteen, dateAsIsoString)
		await cacheHelperObj.updateFromServer()
	}

	return [resource, setDislike]
}