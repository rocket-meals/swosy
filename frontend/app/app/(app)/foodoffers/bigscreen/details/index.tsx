import {ExpoRouter} from "@/.expo/types/router";
import {SEARCH_PARAM_CANTEENS_ID} from "@/app/(app)/foodoffers/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {View, Text} from "@/components/Themed";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import {useEffect, useState} from "react";
import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useSynchedCanteenById} from "@/states/SynchedCanteens";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export const SEARCH_PARAM_CATEGORY = 'category';
export const SEARCH_PARAM_NEXT_FOOD_INTERVAL = 'nextFoodIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL = 'refreshFoodOffersIntervalInSeconds';

export function getRouteToFoodBigScreen(canteen_id: string, category: string | null | undefined, nextFoodIntervalInSeconds: number | null | undefined, fullscreen: boolean): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SEARCH_PARAM_CANTEENS_ID+"="+canteen_id : null;
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let paramForCategory = category ? SEARCH_PARAM_CATEGORY+"="+category : null;
	if(paramForCategory){
		paramsRaw.push(paramForCategory)
	}
	let paramForNextFoodInterval = nextFoodIntervalInSeconds ? SEARCH_PARAM_NEXT_FOOD_INTERVAL+"="+nextFoodIntervalInSeconds : null;
	if(paramForNextFoodInterval){
		paramsRaw.push(paramForNextFoodInterval)
	}

	let paramForFullScreen = fullscreen ? SEARCH_PARAM_FULLSCREEN+"="+fullscreen : null;
	if(paramForFullScreen){
		paramsRaw.push(paramForFullScreen)
	}

	let params = paramsRaw.join("&")
	return `/(app)/foodoffers/bigscreen/details/?${params}` as ExpoRouter.Href;
}

export function useFoodCategoryFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_CATEGORY]?: string }>();
	return params[SEARCH_PARAM_CATEGORY];
}

export function useNextFoodIntervalInSecondsFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_NEXT_FOOD_INTERVAL]?: string }>();
	let nextFoodIntervalInSeconds = params[SEARCH_PARAM_NEXT_FOOD_INTERVAL];
	if(nextFoodIntervalInSeconds){
		return parseInt(nextFoodIntervalInSeconds)
	}
	return undefined;
}

export function useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL]?: string }>();
	let refreshFoodOffersIntervalInSeconds = params[SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL];
	if(refreshFoodOffersIntervalInSeconds){
		return parseInt(refreshFoodOffersIntervalInSeconds)
	}
	return undefined;
}

export default function FoodBigScreenScreen() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_CANTEENS_ID]?: string }>();
	const canteen_id = params[SEARCH_PARAM_CANTEENS_ID];
	const category = useFoodCategoryFromLocalSearchParams();
	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams();
	const refreshFoodOffersIntervalInSeconds = useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const canteen = useSynchedCanteenById(canteen_id);

	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

	async function loadFoodOffers(){
		console.log("Load foodOffers");
		setLoading(true);
		if(!!canteen){
			console.log("Load foodOffers for canteen");
			const date = new Date();
			console.log("Load foodOffers for date: "+date);
			let offers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			console.log("Load foodOffers: "+JSON.stringify(offers, null, 2));
			setFoodOffers(offers);
		}
		setLoading(false);
	}

	// Load foodOffers every 5 minutes
	const INTERVAL = refreshFoodOffersIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(() => {
			loadFoodOffers();
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [canteen, category, nextFoodIntervalInSeconds, refreshFoodOffersIntervalInSeconds]);


	return <MySafeAreaView>
		<MyScrollView>
			<Text>{"FoodBigScreenScreen"}</Text>
			<Text>{"canteen_id: "+canteen_id}</Text>
			<Text>{"canteen"}</Text>
			<Text>{JSON.stringify(canteen, null, 2)}</Text>
			<Text>{"category: "+category}</Text>
			<Text>{"nextFoodIntervalInSeconds: "+nextFoodIntervalInSeconds}</Text>
			<Text>{"FoodOffers:"}</Text>
			<Text>{JSON.stringify(foodOffers, null, 2)}</Text>
		</MyScrollView>
	</MySafeAreaView>
}