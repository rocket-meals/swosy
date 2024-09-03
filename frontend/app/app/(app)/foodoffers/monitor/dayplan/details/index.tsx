import {ExpoRouter} from "@/.expo/types/router";
import {
	SEARCH_PARAM_CANTEENS_ID,
	useCanteensIdFromLocalSearchParams
} from "@/app/(app)/foodoffers/monitor/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {
	Text,
	TEXT_SIZE_2_EXTRA_SMALL,
	TEXT_SIZE_3_EXTRA_LARGE,
	TEXT_SIZE_EXTRA_SMALL,
	useViewBackgroundColor,
	View
} from "@/components/Themed";
import React, {useCallback, useEffect, useRef, useState} from "react";
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
import {getMarkingAlias, getMarkingExternalIdentifier, getMarkingName} from "@/components/food/MarkingListItem";
import DirectusImageOrIconComponent from "@/components/image/DirectusImageOrIconComponent";
import {MyGridFlatList} from "@/components/grid/MyGridFlatList";
import {ListRenderItemInfo, ScrollView} from "react-native";
import {BUTTON_DEFAULT_BorderRadius, BUTTON_DEFAULT_Padding} from "@/components/buttons/MyButtonCustom";

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

	const [reloadNumberForData, setReloadNumberForData] = useState(0);

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const lightContrastColor = useLighterOrDarkerColorForSelection(viewContrastColor);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const canteen_id = useCanteensIdFromLocalSearchParams()

	const nextPageIntervalInSeconds = useNextPageIntervalInSecondsFromLocalSearchParams() || 10;
	const [reloadNumberForPage, setReloadNumberForPage] = useState(0);

	const refreshDataIntervalInSeconds = useRefreshDataIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const canteen = useSynchedCanteenById(canteen_id);
	const canteen_name = getCanteenName(canteen);

	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(null);

	const [layout, setLayout] = useState({width: 0, height: 0});

	const scrollViewRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [visibleItems, setVisibleItems] = useState([]);
	const [itemHeights, setItemHeights] = useState([]);


	// Calculate visible items count
	const calculateVisibleItemsCount = () => {
		if (itemHeights.length === 0 || layout.height === 0) return 1;
		const totalHeight = layout.height;
		let sumHeight = 0;
		let count = 0;

		for (let i = 0; i < itemHeights.length; i++) {
			sumHeight += itemHeights[i];
			if (sumHeight > totalHeight) break;
			count++;
		}

		return count;
	};

	const visibleCount = calculateVisibleItemsCount();


	// Auto-Scroll functionality
	useEffect(() => {
		const interval = setInterval(() => {
			const visibleCount = calculateVisibleItemsCount();
			if (visibleCount > 0 && currentIndex < foodOffers.length) {
				// Scroll to the next set of visible items
				if (scrollViewRef.current) {
					const nextIndex = currentIndex + visibleCount;
					const nextPosition = visibleItems[nextIndex] || 0;
					scrollViewRef.current.scrollTo({ y: nextPosition, animated: true });
					setCurrentIndex((prev) => (nextIndex >= foodOffers.length ? 0 : nextIndex));
				}
			}
			setReloadNumberForPage((prev) => prev + 1);
		}, nextPageIntervalInSeconds * 1000);

		return () => clearInterval(interval);
	}, [visibleItems, currentIndex, nextPageIntervalInSeconds, itemHeights, layout]);

	// Function to handle layout of food offers
	const onFoodOfferLayout = useCallback(
		(event, index) => {
			const { y, height } = event.nativeEvent.layout;
			setVisibleItems((prev) => {
				const newItems = [...prev];
				newItems[index] = y;
				return newItems;
			});
			setItemHeights((prev) => {
				const newHeights = [...prev];
				newHeights[index] = height;
				return newHeights;
			});
		},
		[setVisibleItems, setItemHeights]
	);


	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

	async function loadFoodOffers(){
		setLoading(true);
		if(!!canteen){
			const date = new Date();
			setFoodOfferDateHumanReadable(DateHelper.formatOfferDateToReadable(date, true));
			let offers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			let extraLongList = []
			for(let i=0; i<10; i++){
				extraLongList.push(...offers)
			}
			setFoodOffers(extraLongList);
		}
		setLoading(false);
	}

	// Load foodOffers and markings every 5 minutes
	const INTERVAL = refreshDataIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(async () => {
			console.log("Reload foodoffers and markings")
			await cacheHelperObjMarkings.updateFromServer();
			await loadFoodOffers();
			setReloadNumberForData((prev) => prev + 1);
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [canteen, nextPageIntervalInSeconds, refreshDataIntervalInSeconds]);

	let markingsList: Markings[] = [];
	if(markingsDict){
		let markingKeys = Object.keys(markingsDict);
		for(let i=0; i<markingKeys.length; i++){
			let key = markingKeys[i];
			let marking = markingsDict[key];
			if(marking){
				markingsList.push(marking);
			}
		}
	}


	const sortMarkingsByNameLength = (a: Markings, b: Markings) => {
		const withoutExternalIdentifier = false;
		const a_name = getMarkingName(a, languageCode, withoutExternalIdentifier);
		const b_name = getMarkingName(b, languageCode, withoutExternalIdentifier);
		return a_name.length - b_name.length;
	}
	let sortedMarkingsList = markingsList.sort(sortMarkingsByNameLength);


	function renderMyGridList({ children, amountColumns, paddingColumns }: { children: JSX.Element[]; amountColumns: number; paddingColumns: number }) {
		const columns = [];

		// Distribute children among columns
		for (let i = 0; i < amountColumns; i++) {
			columns.push([]);
		}

		let amountChildren = children.length;
		// children are sorted by name length, so we want to evenly distribute them
		const amountChildrenPerColumn = Math.ceil(amountChildren / amountColumns);
		// fill children in first column until it is full and then continue with the next column
		let currentColumnIndex = 0;
		for (let i = 0; i < amountChildren; i++) {
			const child = children[i];
			columns[currentColumnIndex].push(child);
			if (columns[currentColumnIndex].length >= amountChildrenPerColumn) {
				currentColumnIndex++;
			}
		}

		// Render each column with appropriate styling
		const renderedColumns = columns.map((column, index) => (
			<View
				key={index}
				style={{
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					paddingHorizontal: paddingColumns,
					marginBottom: 10, // Add space between rows if needed
				}}
			>
				{column}
			</View>
		));

		return (
			<View
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'flex-start',
					alignItems: 'flex-start',
					width: '100%',
				}}
			>
				{renderedColumns}
			</View>
		);
	}


	const renderMarking = (marking: Markings) => {
		const withoutExternalIdentifier = true;
		const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
		const external_identifier = getMarkingExternalIdentifier(marking);
		const alias = getMarkingAlias(marking);

		return (
			<View style={{
				flexDirection: "row",
				alignItems: "flex-start",
				justifyContent: "flex-start",
				flex: 1,
				marginVertical: 1,
			}}>
				<View>
					<DirectusImageOrIconComponent resource={marking} />
				</View>
				<View style={{
					backgroundColor: viewBackgroundColor,
					borderColor: viewContrastColor,
					borderWidth: 1,
					borderRadius: BUTTON_DEFAULT_BorderRadius/2,
					marginHorizontal: 2,
					paddingHorizontal: 1,
				}}>
					<Text size={TEXT_SIZE_2_EXTRA_SMALL}>
						{alias}
					</Text>
				</View>
				<View style={{
					paddingVertical: 1,
					flex: 1,
					justifyContent: "flex-start",
					alignItems: "flex-start",
				}}>
					<Text size={TEXT_SIZE_2_EXTRA_SMALL}>
						{translated_name}
					</Text>
				</View>
			</View>
		)
	}

	// Render individual food offers
	const renderFoodOffer = (foodOffer, index) => {
		let backgroundColor = index % 2 === 0 ? lightContrastColor : viewBackgroundColor;
		return (
			<View
				key={index}
				style={{
					width: "100%",
					height: 100,
					backgroundColor,
				}}
				onLayout={(event) => onFoodOfferLayout(event, index)}
			>
				{/* Render FoodOffer content here */}
				<Text>{`Food Offer ${index + 1}`+foodOffer.alias}</Text> {/* Placeholder content */}
			</View>
		);
	};

	function renderPaginatedFoodoffers() {
		return (
			<ScrollView
				ref={scrollViewRef}
				onLayout={(event) => {
					const {width, height} = event.nativeEvent.layout;
					setLayout({width, height});
				}}
				style={{
					overflow: "hidden",
					backgroundColor: "red",
				}}
				onContentSizeChange={(contentWidth, contentHeight) => {
					if (contentHeight <= layout.height) {
						// No need to scroll if content fits within the view
						setCurrentIndex(0);
					}
				}}
			>
				{foodOffers.map((offer, index) => renderFoodOffer(offer, index))}
			</ScrollView>
		);
	}

	function renderContent(){
		const renderedMarkings = [];
		for (let i = 0; i < sortedMarkingsList.length; i++) {
			const marking = sortedMarkingsList[i];
			renderedMarkings.push(renderMarking(marking));
		}

		return <View style={{
			width: '100%',
			height: '100%',
		}}>
			<View style={{
				width: '100%',
				flexDirection: "row",
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
				<MyProgressbar key={""+reloadNumberForPage} duration={nextPageIntervalInSeconds} color={foodAreaColor} />
			</View>
			<View>
				<Text>
					{"totalHeight: "+layout.height}
				</Text>
				<Text>
					{"visibleItems: "+visibleItems.length}
				</Text>
				<Text>
					{"visibleCount: "+visibleCount}
				</Text>
			</View>
			<View style={{
				flex: 1,
				width: '100%',
				backgroundColor: "green",
				overflow: "hidden",
			}}>
				{renderPaginatedFoodoffers()}
			</View>
			<View style={{
				width: '100%',
				opacity: 0.5,
				borderWidth: 3,
				borderColor: "black",
				padding: 10,
			}}>
				{renderMyGridList({
					children: renderedMarkings,
					amountColumns: 8,
					paddingColumns: 1,
				})}
			</View>
			<View style={{
				width: '100%',
				height: 2,
			}}>
				<MyProgressbar key={""+reloadNumberForData} duration={refreshDataIntervalInSeconds} color={foodAreaColor} />
			</View>
		</View>
	}

	return <MySafeAreaView>
		<View style={{
			width: '100%',
			height: '100%',
		}} >
			{renderContent()}
		</View>
	</MySafeAreaView>
}