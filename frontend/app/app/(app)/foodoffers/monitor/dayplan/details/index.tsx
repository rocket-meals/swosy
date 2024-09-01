import {ExpoRouter} from "@/.expo/types/router";
import {
	SEARCH_PARAM_CANTEENS_ID,
	useCanteensIdFromLocalSearchParams
} from "@/app/(app)/foodoffers/monitor/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {Text, TEXT_SIZE_3_EXTRA_LARGE, TEXT_SIZE_EXTRA_SMALL, useViewBackgroundColor, View} from "@/components/Themed";
import React, {useEffect, useState} from "react";
import {Canteens, Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useSynchedCanteenById} from "@/states/SynchedCanteens";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {getCanteenName} from "@/compositions/resourceGridList/canteenGridList";
import {DateHelper} from "@/helper/date/DateHelper";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import {MyProgressbar} from "@/components/progressbar/MyProgressbar";
import {CompanyLogo} from "@/components/project/CompanyLogo";
import {MarkingList} from "@/components/food/MarkingList";
import {getMarkingExternalIdentifier, getMarkingName} from "@/components/food/MarkingListItem";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {ListRenderItemInfo} from "react-native";

export const SEARCH_PARAM_NEXT_PAGE_INTERVAL = 'nextPageIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_DATA_INTERVAL = 'refreshDataIntervalInSeconds';

export function getRouteToFoodofferDayplanScreen(canteen_id: string, nextPageIntervalInSeconds: number | null | undefined, refreshDataIntervalInSeconds: number | null |undefined): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SEARCH_PARAM_CANTEENS_ID+"="+encodeURIComponent(canteen_id) : null;
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let paramForNextFoodInterval = nextPageIntervalInSeconds ? SEARCH_PARAM_NEXT_PAGE_INTERVAL+"="+encodeURIComponent(nextPageIntervalInSeconds) : null;
	if(paramForNextFoodInterval){
		paramsRaw.push(paramForNextFoodInterval)
	}

	let paramForRefreshDataInterval = refreshDataIntervalInSeconds ? SEARCH_PARAM_REFRESH_DATA_INTERVAL+"="+encodeURIComponent(refreshDataIntervalInSeconds) : null;
	if(paramForRefreshDataInterval){
		paramsRaw.push(paramForRefreshDataInterval)
	}

	const fullscreen = true;
	let paramForFullScreen = fullscreen ? SEARCH_PARAM_FULLSCREEN+"="+encodeURIComponent(fullscreen) : null;
	if(paramForFullScreen){
		paramsRaw.push(paramForFullScreen)
	}

	let paramForKioskMode = SearchParams.KIOSK_MODE+"="+encodeURIComponent(true);
	paramsRaw.push(paramForKioskMode)

	let params = paramsRaw.join("&")
	return `/(app)/foodoffers/monitor/dayplan/details/?${params}` as ExpoRouter.Href;
}

export function useNextPageIntervalInSecondsFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_NEXT_PAGE_INTERVAL]?: string }>();
	let nextFoodIntervalInSeconds = params[SEARCH_PARAM_NEXT_PAGE_INTERVAL];
	if(nextFoodIntervalInSeconds){
		return parseInt(nextFoodIntervalInSeconds)
	}
	return undefined;
}

export function useRefreshDataIntervalInSecondsFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_REFRESH_DATA_INTERVAL]?: string }>();
	let refreshFoodOffersIntervalInSeconds = params[SEARCH_PARAM_REFRESH_DATA_INTERVAL];
	if(refreshFoodOffersIntervalInSeconds){
		return parseInt(refreshFoodOffersIntervalInSeconds)
	}
	return undefined;
}

export default function FoodDayPlanScreen() {
	const foods_placeholder_image = useFoodImagePlaceholderAssetId()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const [markingsDict, setMarkingsDict, cacheHelperObjMarkings] = useSynchedMarkingsDict()

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const lightContrastColor = useLighterOrDarkerColorForSelection(viewContrastColor);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const canteen_id = useCanteensIdFromLocalSearchParams()

	const nextPageIntervalInSeconds = useNextPageIntervalInSecondsFromLocalSearchParams() || 10;
	const refreshDataIntervalInSeconds = useRefreshDataIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const canteen = useSynchedCanteenById(canteen_id);
	const canteen_name = getCanteenName(canteen);

	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(null);

	const [layout, setLayout] = useState({width: 0, height: 0});

	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

	async function loadFoodOffers(){
		setLoading(true);
		if(!!canteen){
			const date = new Date();
			setFoodOfferDateHumanReadable(DateHelper.formatOfferDateToReadable(date, true));
			let offers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			setFoodOffers(offers);
		}
		setLoading(false);
	}

	// Load foodOffers and markings every 5 minutes
	const INTERVAL = refreshDataIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(async () => {
			await cacheHelperObjMarkings.updateFromServer();
			await loadFoodOffers();
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [canteen, nextPageIntervalInSeconds, refreshDataIntervalInSeconds]);

	type DataItemMarking = { key: string; data: Markings }
	const dataMarking: DataItemMarking[] = []
	if (markingsDict) {
		const marking_keys = Object.keys(markingsDict);
		for (let i=0; i<marking_keys.length; i++) {
			const marking_key = marking_keys[i];
			const marking = markingsDict[marking_key]
			if(!!marking) {
				dataMarking.push({key: marking_key, data: marking})
			}
		}
	}

	const renderMarking = (info: ListRenderItemInfo<DataItemMarking>) => {
		const {item, index} = info;
		const marking = item.data;
		const withoutExternalIdentifier = true;
		const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
		const external_identifier = getMarkingExternalIdentifier(marking);

		return (
			<View style={{
				flexDirection: "row",
				alignItems: "flex-start",
				justifyContent: "flex-start",
				flex: 1,
			}}>
				<View>
					<DirectusImageOrIconComponent resource={marking} />
				</View>
				<View>
					<Text size={TEXT_SIZE_EXTRA_SMALL}>
						{external_identifier}
					</Text>
				</View>
				<View style={{
					flex: 1,
					justifyContent: "flex-start",
					alignItems: "flex-start",
				}}>
					<Text size={TEXT_SIZE_EXTRA_SMALL}>
						{translated_name}
					</Text>
				</View>
			</View>
		)
	}

	function renderContent(){
		let {width, height} = layout;
		if(!width || !height){
			return <Text>Loading...</Text>
		}

		return <View style={{
			width: '100%',
			height: '100%',
		}}>
			<View style={{
				width: '100%',
				flexDirection: "row",
				backgroundColor: "orange",
			}}>
				<View style={{
					width: 200,
				}}>
					<CompanyLogo style={{
						height: '100%',
						width: '100%',
					}} />
				</View>
				<View style={{
					flex: 1,
					backgroundColor: "red"
				}}>
					<Text size={TEXT_SIZE_3_EXTRA_LARGE}>
						{canteen_name}
					</Text>
					<Text>
						{foodOfferDateHumanReadable}
					</Text>
				</View>
			</View>
			<View style={{
				width: '100%',
				height: 2,
			}}>
				<MyProgressbar duration={nextPageIntervalInSeconds} color={foodAreaColor} />
			</View>
			<View style={{
				flex: 1,
				width: '100%',
				backgroundColor: "green"
			}}>

			</View>
			<View style={{
				width: '100%',
				backgroundColor: "blue"
			}}>
				<MyGridFlatList data={dataMarking} renderItem={renderMarking} amountColumns={9} />
			</View>
		</View>
	}

	return <MySafeAreaView>
		<View style={{
			width: '100%',
			height: '100%',
		}} onLayout={(event) => {
			const {width, height} = event.nativeEvent.layout;
			setLayout({width, height});
		}}>
			{renderContent()}
		</View>
	</MySafeAreaView>
}