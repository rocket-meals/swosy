import {ExpoRouter} from "@/.expo/types/router";
import {SEARCH_PARAM_CANTEENS_ID, useCanteensIdFromLocalSearchParams} from "@/app/(app)/foodoffers/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {Text, View} from "@/components/Themed";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import React, {useEffect, useState} from "react";
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useSynchedCanteenById} from "@/states/SynchedCanteens";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import ImageWithComponents from "@/components/project/ImageWithComponents";
import {Rectangle} from "@/components/shapes/Rectangle";
import {useFoodImagePlaceholderAssetId, useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {AssetHelperTransformOptions} from "@/helper/database/assets/AssetHelperDirectus";
import {Image} from "expo-image";

const companyLogo = require("@/assets/images/company.png");

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
	const foods_placeholder_image = useFoodImagePlaceholderAssetId()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const canteen_id = useCanteensIdFromLocalSearchParams()
	const category = useFoodCategoryFromLocalSearchParams();
	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams() || 10;
	const refreshFoodOffersIntervalInSeconds = useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const canteen = useSynchedCanteenById(canteen_id);
	const [layout, setLayout] = useState({width: 0, height: 0});
	const [food_index, setFoodIndex] = useState(0);

	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

	async function loadFoodOffers(){
		setLoading(true);
		if(!!canteen){
			const date = new Date();
			let offers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			setFoodOffers(offers);
		}
		setLoading(false);
	}

	function getFoodOffersForCategory(category: string | null | undefined): Foodoffers[] {
		if(!category){
			return foodOffers;
		}
		return foodOffers.filter(offer => offer?.food?.category === category);
	}

	const foodOffersForCategory = getFoodOffersForCategory(category);
	const currentFoodOfferForCategory = foodOffersForCategory[food_index];

	// Load foodOffers every 5 minutes
	const INTERVAL = refreshFoodOffersIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(() => {
			loadFoodOffers();
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [canteen, category, nextFoodIntervalInSeconds, refreshFoodOffersIntervalInSeconds]);


	// UseEffect to increase food_index every nextFoodIntervalInSeconds
	useEffect(() => {
		const interval = setInterval(() => {
			setFoodIndex((food_index) => {
				return (food_index + 1) % foodOffersForCategory.length;
			});
		}, nextFoodIntervalInSeconds * 1000);
		return () => clearInterval(interval);
	}, [foodOffersForCategory, nextFoodIntervalInSeconds]);

	function renderContent(currentFoodOfferForCategory: Foodoffers | undefined){
		let {width, height} = layout;
		if(!width || !height){
			return <Text>Loading...</Text>
		}
		let flexDirection = width > height ? 'row' : 'column';
		let minimalDimension = Math.min(width, height);

		const food = currentFoodOfferForCategory?.food as Foods | undefined;
		const assetId = food?.image;
		const image_url = food?.image_remote_url;
		const thumbHash = food?.image_thumb_hash;

		const foodName = getFoodName(food, languageCode);
		const accessibilityLabel = foodName || "Food Image";

		return <View style={{
			width: '100%',
			height: '100%',
			flexDirection: flexDirection
		}}>
			<View style={{
				flex: 1
			}}>
				<View style={{
					flex: 1,
					backgroundColor: "red"
				}}>
					<Image source={companyLogo} style={{
						width: '100%',
						height: '100%'
					}}/>
				</View>
				<View style={{
					flex: 1,
					backgroundColor: "blue"
				}}>

				</View>
				<View style={{
					flex: 1,
					backgroundColor: "red"
				}}>

				</View>
				<View style={{
					flex: 1,
					backgroundColor: "blue"
				}}>

				</View>
			</View>
			<View style={{
				width: minimalDimension,
				height: minimalDimension
			}}>
				<Rectangle>
					<ImageWithComponents image={{
						imageTransform: AssetHelperTransformOptions.HIGH_QUALITY_IMAGE_TRANSFORM,
						fallbackAssetId: foods_placeholder_image,
						image_url: image_url,
						assetId: assetId,
						thumbHash: thumbHash,
					}} accesibilityLabel={accessibilityLabel}
					/>
				</Rectangle>
			</View>
		</View>
	}

	return <MySafeAreaView>
		<View style={{
			width: '100%',
			height: '100%',
			backgroundColor: "orange"
		}} onLayout={(event) => {
			const {width, height} = event.nativeEvent.layout;
			setLayout({width, height});
		}}>
			{renderContent(currentFoodOfferForCategory)}
		</View>
	</MySafeAreaView>
}