import {Foods, FoodsFeedbacks, FoodsMarkings} from '@/helper/database/databaseTypes/types';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {getDemoMarkings} from "@/states/SynchedMarkings";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";


export function getDemoFoods(): Record<string, Foods> {
	const demoNames = ['Fries', 'Burger', 'Lasagne', 'Pizza', 'Pasta', 'Salad', 'Soup', 'Sushi', 'Steak', 'Chicken', 'Fish', 'Rice', 'Noodles', 'Dumplings', 'Curry', 'Tacos', 'Burritos', 'Sandwich', 'Hotdog', 'Kebab', 'Doner', 'Falafel', 'Shawarma']
	const demoCategories = ['PASTA & FRIENDS', "VEGGIE & VEGAN", "SÜSSE ECKE", "EVERGREENS"];
	const demoResources: Record<string, Foods> = {}
	demoNames.forEach((name, index) => {
		const category = demoCategories[index % demoCategories.length];
		const demoResource: Foods = getDemoResource(index, index.toString(), 'Demo '+name+' '+index.toString(), category)
		demoResources[demoResource.id] = demoResource
	})

	return demoResources
}

function getDemoResource(index: number, id: string, name: string, category: string): Foods {
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
	let startIndex = (index*5)%marking_ids.length;
	let endIndex = (index*5+5)%marking_ids.length;

	let selected_marking_ids = marking_ids.slice(startIndex, endIndex);

	let food_markings: FoodsMarkings[] = [];
	for(let marking_id of selected_marking_ids){
		food_markings.push({
			foods_id: id,
			id: index,
			markings_id: marking_id
		})
	}

	let rating_average = (index%5)+(0.1*(index%5));

	return (
		{
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			id: id,
			alias: name,
			category: category,
			image: undefined,
			sort: undefined,
			markings: food_markings,
			status: '',
			rating_average: rating_average,
			rating_amount: (index*10)%200,
			user_created: undefined,
			user_updated: undefined,
			translations: translations,
			feedbacks: [],
			foodoffers: []
		}
	)
}

export async function loadFoodsFeedbacksForFood(foodId: string, isDemo?: boolean): Promise<FoodsFeedbacks[]> {
	if(isDemo) {
		return getDemoFoodsFeedbacks(foodId)
	}

	let foodCollectionHelper = new CollectionHelper<FoodsFeedbacks>('foods_feedbacks')

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

	console.log("loadFoodsFeedbacksLabelIdsForFood query", query)
	let foodsFeedbacks = await foodCollectionHelper.readItems(query)
	return foodsFeedbacks
}



function getDemoFoodsFeedbacks(foodId: string): FoodsFeedbacks[] {
	let amountResources = 100;
	let demoFoodsFeedbacks: FoodsFeedbacks[] = []
	for (let i = 0; i < amountResources; i++) {
		demoFoodsFeedbacks.push(getDemoFoodFeedback(i, foodId))
	}
	return demoFoodsFeedbacks
}



export function getDemoFoodFeedback(index: number, foodId: string): FoodsFeedbacks {
	let feedbackId = "demoFeedbackId" + index
	let rating = index % 5

	let date_updated = new Date();
	// add 1 day for each feedback in the past
	date_updated.setDate(date_updated.getDate() - index);
	let date_updated_string = date_updated.toISOString();

	return {
		status: "published",
		id: feedbackId,
		food: foodId	,
		profile: "demoProfileId "+index,
		date_updated: date_updated_string,
		date_created: date_updated_string,
		rating: rating,
		comment: "demoComment "+index,
		notify: true,
	}
}