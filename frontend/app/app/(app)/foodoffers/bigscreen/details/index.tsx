import {ExpoRouter} from "@/.expo/types/router";
import {SEARCH_PARAM_CANTEENS_ID} from "@/app/(app)/foodoffers/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {View, Text} from "@/components/Themed";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";

const SEARCH_PARAM_CATEGORY = 'category';
const SEARCH_PARAM_NEXT_FOOD_INTERVAL = 'nextFoodIntervalInSeconds';

export function getRouteToFoodBigScreen(canteen_id: string, category: string | null | undefined, nextFoodIntervalInSeconds: number | null | undefined): ExpoRouter.Href {
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

	let paramForFullScreen = SEARCH_PARAM_FULLSCREEN+"=true";
	paramsRaw.push(paramForFullScreen)

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

export default function FoodBigScreenScreen() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_CANTEENS_ID]?: string }>();
	const canteen_id = params[SEARCH_PARAM_CANTEENS_ID];
	const category = useFoodCategoryFromLocalSearchParams();
	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams();

	return <View style={{
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center"
	}}>
		<Text>{"FoodBigScreenScreen"}</Text>
		<Text>{"canteen_id: "+canteen_id}</Text>
		<Text>{"category: "+category}</Text>
		<Text>{"nextFoodIntervalInSeconds: "+nextFoodIntervalInSeconds}</Text>
	</View>
}