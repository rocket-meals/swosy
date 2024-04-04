import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {
	Foods,
	FoodsFeedbacks,
	FoodsFeedbacksFoodsFeedbacksLabels,
	FoodsMarkings
} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {getDemoMarkings} from "@/states/SynchedMarkings";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {getDemoFoodsFeedbacksLabelsDict} from "@/states/SynchedFoodsFeedbacksLabels";

export function useSynchedFoods(): [(Record<string, Foods> | undefined), ((newValue: Record<string, Foods>, timestampe?: number) => void), (number | undefined)] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Foods>(PersistentStore.foods);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoFoods()
	}
	return [usedResources, setResourcesOnly, lastUpdate]
}

export function getDemoFoods(): Record<string, Foods> {
	const demoNames = ['Fries', 'Burger', 'Lasagne', 'Pizza', 'Pasta', 'Salad', 'Soup', 'Sushi', 'Steak', 'Chicken', 'Fish', 'Rice', 'Noodles', 'Dumplings', 'Curry', 'Tacos', 'Burritos', 'Sandwich', 'Hotdog', 'Kebab', 'Doner', 'Falafel', 'Shawarma']
	const demoResources: Record<string, Foods> = {}
	demoNames.forEach((name, index) => {
		const demoResource: Foods = getDemoResource(index, index.toString(), 'Demo '+name+' '+index.toString())
		demoResources[demoResource.id] = demoResource
	})

	return demoResources
}

function getDemoResource(index: number, id: string, name: string): Foods {
	let languages = getDemoLanguagesDict();

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			name: language.code+" - "+name,
			id: id,
			foods_id: id,
			languages_code: language.code
		})
	}

	let all_markings = getDemoMarkings();
	let marking_ids = Object.keys(all_markings);
	// select 5 markings by the position of index, skip dublicates
	let selected_marking_ids = marking_ids.slice(index*5, index*5+5);

	let food_markings: FoodsMarkings[] = [];
	for(let marking_id of selected_marking_ids){
		food_markings.push({
			foods_id: id,
			id: index,
			markings_id: marking_id
		})
	}

	return (
		{
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: id,
			alias: name,
			image: undefined,
			sort: undefined,
			markings: food_markings,
			status: '',
			user_created: undefined,
			user_updated: undefined,
			translations: translations,
		}
	)
}


export function getDictFoodFeedbackLabelsIdToAmount(feedbacks: FoodsFeedbacks[]): Record<string, number> {
	let feedbacksLabelsIds = getFoodFeedbackLabelsIdsFromFeedbacksWithLabels(feedbacks)
	let feedbacksLabelsIdsCounted: Record<string, number> = {}
	for (let feedbacksLabelsId of feedbacksLabelsIds) {
		if (feedbacksLabelsIdsCounted[feedbacksLabelsId] === undefined) {
			feedbacksLabelsIdsCounted[feedbacksLabelsId] = 1
		} else {
			feedbacksLabelsIdsCounted[feedbacksLabelsId] += 1
		}
	}
	return feedbacksLabelsIdsCounted
}

export function getFoodFeedbackLabelsIdsFromFeedbacksWithLabels(feedbacks: (FoodsFeedbacks)[]): string[] {
	let feedbacksLabelsIds: string[] = []
	for (let feedback of feedbacks) {
		for (let label of feedback.labels) {
			feedbacksLabelsIds.push(label.foods_feedbacks_labels_id)
		}
	}
	return feedbacksLabelsIds
}

export async function loadFoodsFeedbacksForFoodWithFeedbackLabelsIds(foodId: string, isDemo?: boolean): Promise<FoodsFeedbacks[]> {
	if(isDemo) {
		return getDemoFoodsFeedbacks()
	}

	let foodCollectionHelper = new CollectionHelper<FoodsFeedbacks>('foods_feedbacks')

	// create a query which finds all labels for the given foodId
	let query = {
		fields: ["*", "labels.*"],
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

	console.log("loadFoodsFeedbacksLabelIdsForFood query", query)
	let foodsFeedbacks = await foodCollectionHelper.readItems(query)
	return foodsFeedbacks
}

function getDemoFoodsFeedbacks(): FoodsFeedbacks[] {
	let amountResources = 100;
	let demoFoodsFeedbacks: FoodsFeedbacks[] = []
	for (let i = 0; i < amountResources; i++) {
		demoFoodsFeedbacks.push(getDemoFoodFeedbackWithLabels(i))
	}
	return demoFoodsFeedbacks
}

export function getDemoFoodFeedbackWithLabels(index: number): FoodsFeedbacks {
	let feedbackId = "demoFeedbackId" + index
	let rating = index % 5

	let demoLabelsDict = getDemoFoodsFeedbacksLabelsDict();
	let demoLabelKeys = Object.keys(demoLabelsDict)
	let labelKey = demoLabelKeys[(index % demoLabelKeys.length)]

	let labelRelation: FoodsFeedbacksFoodsFeedbacksLabels = {
		foods_feedbacks_id: feedbackId,
		foods_feedbacks_labels_id: labelKey,
		id: index
	}

	let date_updated = new Date();
	// add 1 day for each feedback in the past
	date_updated.setDate(date_updated.getDate() - index);
	let date_updated_string = date_updated.toISOString();

	return {
		status: "published",
		id: feedbackId,
		food: "demoFoodId",
		profile: "demoProfileId "+index,
		date_updated: date_updated_string,
		date_created: date_updated_string,
		rating: rating,
		comment: "demoComment "+index,
		notify: true,
		labels: [
			labelRelation
		]
	}
}