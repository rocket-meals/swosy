import {useSyncState} from '@/helper/syncState/SyncState';
import {NonPersistentStore} from '@/helper/syncState/NonPersistentStore';
import {DateHelper} from '@/helper/date/DateHelper';
import {Canteens, Foodoffers, Foods} from '@/helper/database/databaseTypes/types';
import {getDemoFoods} from '@/states/SynchedFoods';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';

export function useCachedFoodOffers() {
	// Structure -
	// Canteen
	// Date
	// How old the cache is?

	// Or should we go by Date first, or either a combined key?

	const [selectedDate, setSelectedDate] = useSyncState<any>(NonPersistentStore.foodOfferCache);

	function getFoodOffer(foodOfferId: string) {

	}

	function getFoodOffers(date: Date, canteen: Canteens) {

	}

	function setFoodOffers(foodOffers: Foodoffers) {

	}
}

export function useFoodOfferSelectedDate(): [Date, (newValue: Date) => void, (days: number) => void]
{
	const [selectedDate, setSelectedDate] = useSyncState<Date>(NonPersistentStore.foodOfferSelectedDate);

	const defaultDate = new Date();
	defaultDate.setHours(12,0,0,0); // set to noon to avoid timezone issues and to have a consistent date to not retrigger useEffects on every render when the milliseconds change
	let usedSelectedDate = selectedDate || defaultDate;
	usedSelectedDate = new Date(usedSelectedDate);

	function changeAmountDays(days: number) {
		const nextDate = DateHelper.addDaysAndReturnNewDate(usedSelectedDate, days);
		setSelectedDate(nextDate);
	}

	return [usedSelectedDate, setSelectedDate, changeAmountDays]
}

export async function loadFoodOfferFromServer(foodoffer_id: string): Promise<Foodoffers> {
	const collectionHelper = new CollectionHelper<Foodoffers>('foodoffers');

	const food_offer_fields = ['*','food.*','food.translations.*', 'markings.*', 'food.markings.*'];

	const query = {
		fields: food_offer_fields
	}

	return await collectionHelper.readItem(foodoffer_id, query);
}

//export async function getFoodOffersForSelectedDate(date: Date, canteen: Canteens, cachedFoodOffers, setCachedFoodOffers){
export async function getFoodOffersForSelectedDate(isDemo: boolean, date: Date, canteen: Canteens) {
	// TODO: useCached Foodoffers
	const copyDate = new Date(date);
	// If in cache not too old, if we have internet connection

	if (isDemo) {
		return getDemoFoodOffersForDate(copyDate);
	}

	// if not in cache, but has internet connection ==> loadFoodOffersFromServer, then save it in cache
	return loadFoodOffersFromServer(canteen, copyDate, 1);
}

export async function loadFoodOffersFromServer(canteen: Canteens, date: Date, amountDays?: number): Promise<Foodoffers[]> {
	const collectionHelper = new CollectionHelper<Foodoffers>('foodoffers');

	const food_offer_fields = ['*','food.*','food.translations.*', 'markings.*'];

	if (amountDays===undefined) {
		amountDays = 1;
	}

	const andFilters = [];

	const paramDate = DateHelper.formatToOfferDate(date);
	const formatedDate = new Date(paramDate);
	const dateRanges = DateHelper.getDatesOfAmountNextDaysIncludingToday(formatedDate, amountDays);

	const startRange = dateRanges[0];
	const start = new Date(startRange[0]);

	const endRange = dateRanges[dateRanges.length-1];
	const end = new Date(endRange[1]);

	andFilters.push(
		{
			date: {
				_between: [start.toISOString(), end.toISOString()]
			}
		}
	);

	andFilters.push(
		{
			canteen: {
				_eq: canteen.id,
			}
		}
	)

	const dateFilter = {
		_and: andFilters
	}

	const query = {
		limit: -1,
		filter: dateFilter,
		fields: food_offer_fields
	}

	return await collectionHelper.readItems(query);
}

function getDemoFoodOffersForDate(date: Date): Foodoffers[]
{
	if (DateHelper.isWeekend(date)) {
		return [];
	}

	const demoFoods = getDemoFoods();
	const demoFoodOffer: Foodoffers[] = [];
	const demoFoodsKeys = Object.keys(demoFoods);

	let amount = 500 + date.getDay() // add day to get different amount of foods for each day
	if (amount > demoFoodsKeys.length) {
		amount = demoFoodsKeys.length;
	}

	// now lets select a bit of random foods based on the date
	const randomFoods: Foods[] = [];
	const start = date.getDay(); // start with the day of the week
	for (let i = 0; i < amount; i++) {
		randomFoods.push(demoFoods[demoFoodsKeys[(start + i) % demoFoodsKeys.length]]);
	}


	for (let i = 0; i < randomFoods.length; i++) {
		const food = randomFoods[i];
		demoFoodOffer.push({
			date: date.toISOString(),
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
			price_student: 2.5
		});
	}

	return demoFoodOffer;
}