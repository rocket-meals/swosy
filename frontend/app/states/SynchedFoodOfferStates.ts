import {useSyncState} from '@/helper/syncState/SyncState';
import {NonPersistentStore} from '@/helper/syncState/NonPersistentStore';
import {DateHelper} from '@/helper/date/DateHelper';
import {Canteens, Foodoffers, FoodoffersCategories, Foods, FoodsFeedbacks} from '@/helper/database/databaseTypes/types';
import {getDemoFoods} from '@/states/SynchedFoods';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSearchParamSelectedFoodoffersDate} from "@/helper/searchParams/SearchParams";
import {useEffect} from "react";
import {getDemoFoodsAttributesValuesAsList} from "@/states/SynchedFoodattributes";

export function useFoodOfferSelectedDate(): [Date, (newValue: Date) => void, (days: number) => void]
{
	const [selectedDate, setSelectedDate] = useSyncState<Date, Date>(NonPersistentStore.foodOfferSelectedDate);
	const [selectedDateFromParams, setSelectedDateFromParams] = useSearchParamSelectedFoodoffersDate();

	const defaultDate = new Date();
	let usedSelectedDate = selectedDate || selectedDateFromParams || defaultDate;
	let usedSelectedDateAsDate = new Date(usedSelectedDate);
	formatDateForFoodSelection(usedSelectedDateAsDate); // set to noon to avoid timezone issues and to have a consistent date to not retrigger useEffects on every render when the milliseconds change

	function changeAmountDays(days: number) {
		const nextDate = DateHelper.addDaysAndReturnNewDate(usedSelectedDateAsDate, days);
		setSelectedDate(nextDate);
	}

	return [usedSelectedDateAsDate, setSelectedDate, changeAmountDays]
}

export function formatDateForFoodSelection(date: Date): Date{
	date.setHours(12,0,0,0);
	return date;
}

export const TABLE_NAME_FOODOFFERS = 'foodoffers';
export const TABLE_NAME_FOODS = 'foods';

const QUERY_FIELDS_FOOD_OFFER = ['*','food.*', '!food.feedbacks' ,'food.translations.*', 'markings.*', "attribute_values.*"];
const QUERY_FIELDS_FOOD = ['*','translations.*', 'markings.*', "attribute_values.*"];

export function useFoodFeedbacks(food_id: string, offset: number, limit: number): FoodsFeedbacks[] {
	const [dictFoodIdToFoodFeedbacks, setDictFoodIdToFoodFeedbacks] = useSyncState<Record<string, FoodsFeedbacks[]>>(NonPersistentStore.foodFeedbacks);

	useEffect(() => {
		// Load food feedbacks from server whenever the food_id changes or the offset or limit changes
		// If the food_id is not set, then the feedbacks are not loaded
		if (!food_id) return;

		const fetchFeedbacks = async () => {
			try {
				const food = await loadFoodFeedbacksFromServer(food_id, offset, limit);
				// Assuming food.feedbacks is the array of feedbacks you want to store
				setDictFoodIdToFoodFeedbacks((prevFeedbacks) => ({
					...prevFeedbacks,
					[food_id]: food.feedbacks || [], // Default to an empty array if feedbacks are undefined
				}));
			} catch (error) {
				console.error('Failed to load food feedbacks:', error);
				// Handle error appropriately here, e.g., set an error state or show a notification
			}
		};

		fetchFeedbacks();
	}, [food_id, offset, limit, setDictFoodIdToFoodFeedbacks]);

	// Return the feedbacks for the current food_id, or an empty array if not available
	return dictFoodIdToFoodFeedbacks?.[food_id] || [];
}

export async function loadFoodFeedbacksFromServer(food_id: string, offset: number, limit: number): Promise<Foods> {
	const collectionHelper = new CollectionHelper<Foods>(TABLE_NAME_FOODS);

	const query = {
		fields: ['feedbacks.*'],
		limit: limit,
		offset: offset
	}

	return await collectionHelper.readItem(food_id, query);
}

async function loadFoodOfferFromServer(foodoffer_id: string): Promise<Foodoffers> {
	const collectionHelper = new CollectionHelper<Foodoffers>(TABLE_NAME_FOODOFFERS);

	const query = {
		fields: QUERY_FIELDS_FOOD_OFFER
	}

	return await collectionHelper.readItem(foodoffer_id, query);
}

export class FoodHelper {

	static async loadMostLikedOrDislikedFoods(limit: number, offset: number, minRatingAmount: number | undefined, bestFirst: boolean){
		const collectionHelper = new CollectionHelper<Foods>(TABLE_NAME_FOODS);
		if(!minRatingAmount){
			minRatingAmount = 1;
		}

		// Initialize the filters array
		const andFilters = [];

		// Filter for rating_amount if minRatingAmount is specified
		if (minRatingAmount !== undefined) {
			andFilters.push({
				rating_amount: {
					_gte: minRatingAmount
				}
			});
		}

		const sort = bestFirst ? '-rating_average' : 'rating_average'

		// Construct the query object
		const query = {
			limit: limit,
			offset: offset,
			filter: {
				_and: andFilters
			},
			sort: [sort],  // Sort by rating_average in descending order
			fields: QUERY_FIELDS_FOOD
		};

		return await collectionHelper.readItems(query);
	}
}


async function loadFoodFromServer(food_id: string): Promise<Foods> {
	const collectionHelper = new CollectionHelper<Foods>(TABLE_NAME_FOODS);

	const query = {
		fields: QUERY_FIELDS_FOOD
	}

	return await collectionHelper.readItem(food_id, query);
}

export async function loadFood(isDemo: boolean, food_id: string): Promise<Foods> {
	if(isDemo){
		const demoFoods = getDemoFoods();
		return demoFoods[food_id];
	}

	// TODO: #125 : https://github.com/rocket-meals/rocket-meals/issues/125 Caching Food implement here?
	// Change to a useFood maybe?

	return await loadFoodFromServer(food_id);
}

export async function loadFoodOffer(isDemo: boolean, foodoffer_id: string): Promise<Foodoffers | null> {
	if(isDemo){
		let foodOffers = getDemoFoodOffersForDate(undefined);
		console.log("SynchedFoodOfferStates: loadFoodOffer: isDemo: true, foodOffers", foodOffers)
		for(let foodOffer of foodOffers){
			if(foodOffer.id === foodoffer_id){
				return foodOffer;
			}
		}
		return null;
	}

	return await loadFoodOfferFromServer(foodoffer_id);
}

//export async function getFoodOffersForSelectedDate(date: Date, canteen: Canteens, cachedFoodOffers, setCachedFoodOffers){
export async function getFoodOffersForSelectedDate(isDemo: boolean, date: Date, canteen: Canteens) {
	console.log("getFoodOffersForSelectedDate: isDemo:"+isDemo+" date:"+date+" canteen:"+canteen)
	// TODO: useCached Foodoffers
	const copyDate = new Date(date);
	// If in cache not too old, if we have internet connection

	if (isDemo) {
		return getDemoFoodOffersForDate(copyDate);
	}

	// if not in cache, but has internet connection ==> loadFoodOffersFromServer, then save it in cache
	return loadFoodOffersFromServer(canteen, copyDate, 0);
}

/**
 * Please use getFoodOffersForSelectedDate instead
 * @param canteen
 * @param date
 * @param amountAdditionalDays
 */
async function loadFoodOffersFromServer(canteen: Canteens, date: Date, amountAdditionalDays?: number): Promise<Foodoffers[]> {
	const collectionHelper = new CollectionHelper<Foodoffers>(TABLE_NAME_FOODOFFERS);

	if (amountAdditionalDays===undefined) {
		amountAdditionalDays = 0;
	}

	const andFilters = [];

	const paramDate = DateHelper.formatToOfferDate(date);
	const formatedDate = new Date(paramDate);
	const [startdate, endDate] = DateHelper.getDatesOfAmountNextDaysIncludingToday(formatedDate, amountAdditionalDays);
	const paramDateStart = DateHelper.formatToOfferDate(startdate);
	const paramDateEnd = DateHelper.formatToOfferDate(endDate);

	andFilters.push(
		{
			_or: [
				{
					_and: [
						{
							date: {
								_gte: paramDateStart
							}
						},
						{
							date: {
								_lte: paramDateEnd
							}
						}
					]
				},
				{
					date: {
						// is null or empty
						_null: true
					}
				}
			]
		}
	);

	andFilters.push(
		{
			canteen: {
				_eq: canteen.id,
			}
		}
	)

	const filter = {
		_and: andFilters
	}

	const query = {
		limit: -1,
		filter: filter,
		fields: QUERY_FIELDS_FOOD_OFFER
	}

	return await collectionHelper.readItems(query);
}

export async function loadFoodCategoriesForNext7Days(isDemo: boolean): Promise<string[]> {
	const foodOffers = await loadAllFoodOffersFromServer(isDemo, new Date(), 6);
	const categories: {[key: string]: string} = {};
	for (const foodOffer of foodOffers) {
		const food = foodOffer.food;
		if (food && typeof food !== 'string') {
			if(food.category && food.category.length > 0){
				categories[food.category] = food.category;
			}
		}
	}
	return Object.keys(categories);
}

async function loadAllFoodOffersFromServer(isDemo: boolean, date:Date, additionalDays: number): Promise<Foodoffers[]> {
	const copyDate = new Date(date);

	if (isDemo) {
		return getDemoFoodOffersForDate(copyDate);
	}
	const collectionHelper = new CollectionHelper<Foodoffers>(TABLE_NAME_FOODOFFERS);

	if (additionalDays===undefined) {
		additionalDays = 0;
	}

	const andFilters = [];

	const paramDate = DateHelper.formatToOfferDate(date);
	const formatedDate = new Date(paramDate);
	const [startdate, endDate] = DateHelper.getDatesOfAmountNextDaysIncludingToday(formatedDate, additionalDays);
	const paramDateStart = DateHelper.formatToOfferDate(startdate);
	const paramDateEnd = DateHelper.formatToOfferDate(endDate);

	andFilters.push(
		{
			_or: [
				{
					_and: [
						{
							date: {
								_gte: paramDateStart
							}
						},
						{
							date: {
								_lte: paramDateEnd
							}
						}
					]
				},
				{
					date: {
						// is null or empty
						_null: true
					}
				}
			]
		}
	);

	const filter = {
		_and: andFilters
	}

	const query = {
		limit: -1,
		filter: filter,
		fields: QUERY_FIELDS_FOOD_OFFER
	}

	return await collectionHelper.readItems(query);
}

function getDemoFoodOffersForDate(date: Date | undefined): Foodoffers[]
{
	if(!!date){
		if (DateHelper.isWeekend(date)) {
			return [];
		}
	}

	const demoFoods = getDemoFoods();
	const demoFoodOffer: Foodoffers[] = [];
	const demoFoodsKeys = Object.keys(demoFoods);

	let amount = 12 // add day to get different amount of foods for each day
	if (amount > demoFoodsKeys.length) {
		amount = demoFoodsKeys.length;
	}

	// now lets select a bit of random foods based on the date
	const randomFoods: Foods[] = [];
	let start = 0
	if(!!date){
		start += date.getDay(); // start with the day of the week
	}
	for (let i = 0; i < amount; i++) {
		randomFoods.push(demoFoods[demoFoodsKeys[(start + i) % demoFoodsKeys.length]]);
	}

	for (let i = 0; i < randomFoods.length; i++) {
		const food = randomFoods[i];
		let foodDate = new Date();
		if(!!date){
			foodDate = date;
		}

		demoFoodOffer.push({
			date: foodDate.toISOString(),
			food: food,
			id: i+'',
			markings: food.markings,
			status: 'active',
			user_created: undefined,
			user_updated: undefined,
			date_created: new Date().toISOString(),
			date_updated: new Date().toISOString(),
			price_employee: 3.5,
			price_guest: 4.5,
			price_student: 2.5,
			// placeholders for the expandable fields in directus
			environmental_impact: "",
			nutrition: "",
			prices: "",
			attribute_values: getDemoFoodsAttributesValuesAsList(),
		});
	}

	return demoFoodOffer;
}
