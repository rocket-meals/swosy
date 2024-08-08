import {defineHook} from '@directus/extensions-sdk';
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const SCHEDULE_NAME = "food_feedback_rating_calculate";

export default defineHook(async ({action, filter}, apiContext) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	const {
		services,
		database,
		getSchema,
		logger
	} = apiContext;

	const collection = CollectionNames.FOODS_FEEDBACKS

	let schema = await getSchema();
	let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
	let foodsService = itemsServiceCreator.getItemsService(CollectionNames.FOODS);
	let foodfeedbacksService = itemsServiceCreator.getItemsService(collection);


	async function getFoodIdsFromFoodFeedbackIds(food_feedback_ids: string[]){
		let food_id_dict: {[key: string]: boolean} = {}

		for(let food_feedback_id of food_feedback_ids){
			let food_feedback = await foodfeedbacksService.readOne(food_feedback_id);
			let food_id = food_feedback?.food;
			if(!!food_id){
				food_id_dict[food_id] = true;
			}
		}

		return Object.keys(food_id_dict);
	}

	function recalculateFoodIdsRatingsNonBlocking(food_ids: string[], ignore_food_feedback_ids?: string[]){
		for(let food_id of food_ids){
			// await // we do not want to block the deletion of the food_feedbacks
			recalculateFoodRating(food_id, ignore_food_feedback_ids);
		}
	}

	async function recalculateFoodRating(food_id: string, ignore_food_feedback_ids?: string[]){
		//console.log("recalculateFoodRating: food_id: "+food_id);

		let ignore_food_feedbacks_ids_dict: {[key: string]: boolean} = {}
		if(!!ignore_food_feedback_ids){
			for(let ignore_food_feedback_id of ignore_food_feedback_ids){
				ignore_food_feedbacks_ids_dict[ignore_food_feedback_id] = true;
			}
		}

		let food_feedbacks = [];
		try{
			food_feedbacks = await foodfeedbacksService.readByQuery({
				filter: {
					food: food_id
				},
				limit: -1
			})
		} catch (e){
			// When no feedbacks are found for the filter, we get an error:
		}

		let sum = 0;
		let rating_amount = 0;
		const MAX_RATING = 5;
		const MIN_RATING = 1;
		for(let food_feedback of food_feedbacks){
			let food_feedback_id = food_feedback.id;
			let ignore = ignore_food_feedbacks_ids_dict[food_feedback_id];

			if(!ignore){
				let rating = food_feedback?.rating;
				if(rating!==undefined && rating!==null){ // then must be a number
					if(MIN_RATING <= rating && rating <= MAX_RATING){ // rating is in valid range // Altough we checked that in directus, better safe than sorry
						sum += rating;
						rating_amount++;
					}
				}
			}
		}
		if(rating_amount > 0){
			let rating_average = sum / rating_amount;
			//console.log("recalculateFoodRating: food_id: "+food_id+" | sum: "+sum+" | rating_amount: "+rating_amount+" | rating_average: "+rating_average+" | food_feedbacks.length: "+food_feedbacks.length);

			await foodsService.updateOne(food_id, {
				rating_average: rating_average,
				rating_amount: rating_amount
			})

		} else {
			//console.log("recalculateFoodRating: food_id: "+food_id+" | rating_amount: "+rating_amount+" | food_feedbacks.length: "+food_feedbacks.length);
			// set for food both values to null
			await foodsService.updateOne(food_id, {
				rating_average: null,
				rating_amount: 0
			})
		}
	}


	action(
		collection + ".items.update",
		async (meta) => {
			// get the collection which was updated
			//console.log("UPDATE FOOD FEEDBACKS");
			//console.log(meta);

			let food_feedbacks_ids = meta.keys;
			let food_ids = await getFoodIdsFromFoodFeedbackIds(food_feedbacks_ids);
			let ignore_food_feedback_ids: string[] = [] // we do not want to ignore any food_feedbacks since we just created them
			recalculateFoodIdsRatingsNonBlocking(food_ids, ignore_food_feedback_ids);
			// {
			//   event: 'foods_feedbacks.items.update',
			//   payload: { rating: 4 },
			//   keys: [ '73e6dd26-f570-428d-8f8c-0a452beb222e' ],
			//   collection: 'foods_feedbacks'
			// }

		}
	);

	action(
		collection + ".items.create",
		async (meta) => {
			// get the collection which was created
			//console.log("CREATE FOOD FEEDBACKS");
			//console.log(meta);
			let food_feedback_id = meta.key;
			let food_feedbacks_ids = [food_feedback_id];
			let food_ids = await getFoodIdsFromFoodFeedbackIds(food_feedbacks_ids);
			let ignore_food_feedback_ids: string[] = [] // we do not want to ignore any food_feedbacks since we just updated them
			recalculateFoodIdsRatingsNonBlocking(food_ids, ignore_food_feedback_ids);
			//{
			//  |   event: 'foods_feedbacks.items.create',
			//  payload: { rating: 4, food: '1090' },
			//  key: '54e58fc8-3a15-42ed-b27b-856adffdd20c',
			//  collection: 'foods_feedbacks'
			//}

		}
	);

	//action( // we cannot use action here, because we would only get the keys of the deleted food_feedbacks. From this we dont know the food_id. Therefore we need to use filter, but we do not block the deletion of the food_feedbacks
	filter(
		collection + ".items.delete",
		async (payloadModifiable,
			   // @ts-ignore
			   meta, context) => {
			// get the collection which was deleted
			//console.log("DELETE FOOD FEEDBACKS");
			//console.log("payloadModifiable");
			//console.log(payloadModifiable);
			// [ '78d05b3b-7939-4308-9d38-098426d687cd' ]

			//console.log("meta");
			//console.log(meta);
			// {
			//   event: 'foods_feedbacks.items.delete',
			//   collection: 'foods_feedbacks'
			// }

			//console.log("context");
			//console.log(context);
			// Information about the user and the permissions and so on

			let food_feedbacks_ids = payloadModifiable;


			// check if food_feedbacks_ids is an array and the object exists
			if(!food_feedbacks_ids || !Array.isArray(food_feedbacks_ids) || food_feedbacks_ids.length === 0){
				// do nothing
			} else {
				let food_ids = await getFoodIdsFromFoodFeedbackIds(food_feedbacks_ids);
				let ignore_food_feedback_ids: string[] = food_feedbacks_ids // ATTENTION: we want to ignore the deleted food_feedbacks.
				// Because we are filtering, the feedback is not deleted yet, resulting in a wrong rating calculation considering the to be deleted feedbacks
				// Therefore we want to ignore the deleted feedbacks
				recalculateFoodIdsRatingsNonBlocking(food_ids, ignore_food_feedback_ids);
			}
			return payloadModifiable;
		}
	);
});
