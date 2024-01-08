import {CustomDirectusTypes, Foodoffers} from "../../directusTypes/types";
import {ServerAPI} from "../../../kitcheningredients";
import {Directus, Filter, PartialItem, TypeOf} from "@directus/sdk";
import {DateHelper} from "../../helper/DateHelper";

export class FoodLoader{

	static collection_foods = "foods";
	static collection_foodoffers = "foodoffers";

	static food_offer_fields = ['*',"food.*","food.translations.*", 'markings.*'];
	static food_fields =['*', 'markings.*','feedbacks.*', "translations.*"];

	static async loadFoodOffer(foodoffer_id){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		let answer = await directus.items(FoodLoader.collection_foodoffers).readOne(foodoffer_id, {
			fields: FoodLoader.food_offer_fields,
		});
		return answer;
	}

	static async getFoodOffers(date: Date, canteenId?, amountDays?): Promise<PartialItem<TypeOf<CustomDirectusTypes, Foodoffers>>[]>{
		if(amountDays===undefined){
			amountDays = 1;
		}

		let dateFilter: Filter<any> = {};
		let andFilters = [];

		if(!!date){
			let paramDate = DateHelper.formatToOfferDate(date);
			let formatedDate = new Date(paramDate);
			let dateRanges = DateHelper.getDatesOfAmountNextDaysIncludingToday(formatedDate, amountDays);

			let startRange = dateRanges[0];
			let start = new Date(startRange[0]);

			let endRange = dateRanges[dateRanges.length-1];
			let end = new Date(endRange[1]);

			//console.log("start");
			//console.log(start);
			//console.log("end");
			//console.log(end);

			andFilters.push(
				{
					date: {
						_between: [start.toISOString(), end.toISOString()]
					}
				}
			);
		}

		if(!!canteenId){
			andFilters.push(
				{
					canteen: {
						_eq: canteenId,
					}
				}
			)
		}

		dateFilter = {
			_and: andFilters
		}

		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();

		try{
			let answer = await directus.items(FoodLoader.collection_foodoffers).readByQuery({
				limit: -1,
				filter: dateFilter,
				fields: FoodLoader.food_offer_fields
			});
			let items = answer?.data;
			//console.log(items);
			return items;
		} catch (err){
			//console.log("Error at Load Foodoffers");
			//console.log(err);
			return null;
		}
	}

	static async searchFood(partialname, limitSearchResults?){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		let answer = await directus.items(FoodLoader.collection_foods).readByQuery({
			limit: limitSearchResults,
			filter: {
				_and: [
					{
						translations: {
							name: {
								_contains: partialname
							}
						}
					}
				]
			},
			fields: FoodLoader.food_fields
		})
		return answer?.data;
	}

	static async loadFoodDetails(food_id){
		let directus: Directus<CustomDirectusTypes> = ServerAPI.getClient();
		let answer = await directus.items(FoodLoader.collection_foods).readOne(food_id, {
			fields: FoodLoader.food_fields,
		});
		return answer;
	}

	static getDemoFeedbacks(foods_id){
		return [
			{
				"id": 2,
				"status": "published",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:14:49",
				"user_updated": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_updated": "2022-06-21T09:16:47",
				"foods_id": foods_id,
				"profiles_id": 2,
				"comment": "Klasse",
				"canteen_id": 1,
				"rating": 4.5
			},
			{
				"id": 3,
				"status": "draft",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:17:07",
				"user_updated": null,
				"date_updated": null,
				"foods_id": foods_id,
				"profiles_id": 3,
				"comment": "Unterirdisch",
				"canteen_id": 2,
				"rating": 1.5
			},
			{
				"id": 4,
				"status": "published",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:17:25",
				"user_updated": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_updated": "2022-06-21T09:17:31",
				"foods_id": foods_id,
				"profiles_id": 4,
				"comment": "War ganz gut",
				"canteen_id": null,
				"rating": 3
			},
			{
				"id": 5,
				"status": "published",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:18:24",
				"user_updated": null,
				"date_updated": null,
				"foods_id": foods_id,
				"profiles_id": 5,
				"comment": "Mehr TestSoße bitte",
				"canteen_id": 1,
				"rating": 3.5
			},
			{
				"id": 6,
				"status": "published",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:18:55",
				"user_updated": null,
				"date_updated": null,
				"foods_id": foods_id,
				"profiles_id": 6,
				"comment": "Wie bei Mutti !",
				"canteen_id": 3,
				"rating": 4
			},
			{
				"id": 7,
				"status": "published",
				"sort": null,
				"user_created": "bb47dabd-4745-4353-ae63-96caa5a20503",
				"date_created": "2022-06-21T09:19:21",
				"user_updated": null,
				"date_updated": null,
				"foods_id": foods_id,
				"profiles_id": 2,
				"comment": "War nett",
				"canteen_id": null,
				"rating": 2
			}
		];
	}

	private static getDemoFoodMarkings(food_id, index){
		let demoMarkingIds = [1, 18, 35, 23, 28, 34];

		let demoMarkings = [];
		let amountMarkings = demoMarkingIds.length/2;
		for(let i = 0; i < amountMarkings; i++){
			let demoMarkingId = demoMarkingIds[(index+i) % demoMarkingIds.length];
			demoMarkings.push({
				"id": -index+1000,
				"foods_id": food_id,
				"markings_id": demoMarkingId,
			});
		}

		//console.log("demoMarkings");
		//console.log(demoMarkings);

		return demoMarkings;
	}

	static getDemoFoodDetails(food_id){
		let demoFoodOffers = FoodLoader.getDemoFoodOffers();
		let foodOffer = demoFoodOffers.find(fo => fo.food.id == food_id);
		let food = foodOffer.food;
		return food;
	}

	private static getDemoPrivateFoodDetails(customFoodName?: string, index?: number){
		let demoFoodName = customFoodName || "Food Name";
		index = index || 0;

		let food_id = index

		const feedbacks = this.getDemoFeedbacks(food_id);
		const markings = this.getDemoFoodMarkings(food_id, index);

		return(
			{
				"calories_kcal": 476,
				"carbohydrate_g": 35,
				"date_created": null,
				"date_updated": "2022-11-13T15:52:41.656Z",
				"extra": null,
				"fat_g": 18,
				"fiber_g": null,
				"id": food_id,
				"image": null,
				"name": null,
				"protein_g": null,
				"saturated_fat_g": 7,
				"sodium_g": 4,
				"sort": null,
				"status": "published",
				"sugar_g": 5,
				"user_created": null,
				"user_updated": null,
				"feedbacks": feedbacks,
				"markings": markings,
				"translations": [
					{
						"id": 7469,
						"languages_code": "de-DE",
						"foods_id": "1216-1884",
						"name": demoFoodName+" DE",
					},
					{
						"id": 7470,
						"languages_code": "en-US",
						"foods_id": "1216-1884",
						"name": demoFoodName+" EN",
					}
				]
			}
		)
	}

	static getDemoFoodOffer(foodoffer_id){
		let demoFoodOffers = FoodLoader.getDemoFoodOffers();
		let foodOffer = demoFoodOffers.find(fo => fo.id == foodoffer_id);
		return foodOffer;
	}

	private static getDemoFoodOfferByIndex(index){
		let priceStudent = 0.5+(index%5)*0.3;
		let priceEmployee = priceStudent+1.1;
		let priceGuest = priceEmployee+1.2;

		let names = ["Chicken", "Beef", "Pork", "Fish", "Salad", "Dessert", "Menu", "Tacco", "Creme", "Pizza", "Burger"];
		let name = names[index%names.length];

		const food_id = index

		const markings = this.getDemoFoodMarkings(food_id, index)

		return {
			"id": index,
			"status": "published",
			"sort": null,
			"user_created": null,
			"date_created": "2022-05-23T23:56:08",
			"user_updated": null,
			"date_updated": "2022-05-23T23:56:08",
			"price_student": priceStudent,
			"price_employee": priceEmployee,
			"price_guest": priceGuest,
			"canteen": 1,
			"date": "2022-05-25",
			"markings": markings,
			"food": FoodLoader.getDemoPrivateFoodDetails( "Demo "+name, index),
		}
	}

	static getDemoFoodOffers(){
		let amountDemoFoodOffers = 10;
		let demoFoodOffers = [];
		for(let i = 0; i < amountDemoFoodOffers; i++){
			let foodOffer = this.getDemoFoodOfferByIndex(i+1);
			demoFoodOffers.push(foodOffer);
		}
		return demoFoodOffers;
	}

}
