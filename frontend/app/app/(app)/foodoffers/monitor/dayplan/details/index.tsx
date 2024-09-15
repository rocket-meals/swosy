import {ExpoRouter} from "@/.expo/types/router";
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
import {Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {getCanteenName} from "@/compositions/resourceGridList/canteenGridList";
import {DateHelper} from "@/helper/date/DateHelper";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import {MyProgressbar} from "@/components/progressbar/MyProgressbar";
import {CompanyLogo} from "@/components/project/CompanyLogo";
import {getMarkingName} from "@/components/food/MarkingListItem";
import {ScrollView} from "react-native";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {FoodInformationValueFormatter} from "@/components/food/FoodDataList";
import {MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";

export const SEARCH_PARAM_NEXT_PAGE_INTERVAL = 'nextPageIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_DATA_INTERVAL = 'refreshDataIntervalInSeconds';

export function getRouteToFoodofferDayplanScreen(canteen_id: string, nextPageIntervalInSeconds: number | null | undefined, refreshDataIntervalInSeconds: number | null |undefined): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SearchParams.CANTEENS_ID+"="+encodeURIComponent(canteen_id) : null;
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

	const translation_category = useTranslation(TranslationKeys.category)
	const translation_foodname = useTranslation(TranslationKeys.foodname)
	const translation_markings = useTranslation(TranslationKeys.markings)
	const translation_kcal = useTranslation(TranslationKeys.nutrition_calories)
	const translation_nutrition_fat = useTranslation(TranslationKeys.nutrition_fat)
	const translation_nutrition_saturated_fat = useTranslation(TranslationKeys.nutrition_saturated_fat)
	const translation_nutrition_nutrition_carbohydrate = useTranslation(TranslationKeys.nutrition_carbohydrate)
	const translation_nutrition_sugar = useTranslation(TranslationKeys.nutrition_sugar)
	const translation_nutrition_protein = useTranslation(TranslationKeys.nutrition_protein)
	const translation_nutrition_salt = useTranslation(TranslationKeys.nutrition_salt)
	const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
	const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
	const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

	const translation_no_value = useTranslation(TranslationKeys.no_value);

	const [reloadNumberForData, setReloadNumberForData] = useState(0);

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const viewBackgroundColorLighter = useLighterOrDarkerColorForSelection(viewBackgroundColor);
	const viewBackgroundColorLighterContrast = useMyContrastColor(viewBackgroundColorLighter);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const [canteen, setCanteen] = useSynchedProfileCanteen();

	const nextPageIntervalInSeconds = useNextPageIntervalInSecondsFromLocalSearchParams() || 10;
	const [reloadNumberForPage, setReloadNumberForPage] = useState(0);

	const refreshDataIntervalInSeconds = useRefreshDataIntervalInSecondsFromLocalSearchParams() || 5 * 60;
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
			//let extraLongList = []
			//for(let i=0; i<10; i++){
			//	extraLongList.push(...offers)
			//}
			//offers = extraLongList
			setFoodOffers(offers);
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

	function renderMarkingsForFoodRow(foodOffer: Foodoffers){
		let renderedMarkings: any[] = [];
		let foodoffersmarkingJoinElements = foodOffer.markings;
		let markingsForFoodOffer: Markings[] = [];
		if(!!markingsDict){
			for(let i=0; i<foodoffersmarkingJoinElements.length; i++){
				let joinElement = foodoffersmarkingJoinElements[i];
				let markingId = joinElement?.markings_id;
				let marking = markingsDict?.[markingId];
				if(!!marking){
					markingsForFoodOffer.push(marking)
				}
			}
		}
		let sortedMarkingsForFoodOffer = markingsForFoodOffer.sort(sortMarkingsByNameLength);
		for (let i = 0; i < sortedMarkingsForFoodOffer.length; i++) {
			const marking = sortedMarkingsForFoodOffer[i];
			renderedMarkings.push(<MarkingIconOrShortCodeWithTextSize markingId={marking.id} textSize={TEXT_SIZE_2_EXTRA_SMALL} />);
		}
		return <View style={{
			flex: 1,
			flexWrap: "wrap",
			flexDirection: "row",
		}}>
			{renderedMarkings}
		</View>;
	}

	const renderMarking = (marking: Markings, withTranslation: boolean = true) => {
		const withoutExternalIdentifier = true;
		const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);

		let renderedTranslation = null
		if(withTranslation){
			renderedTranslation = <View style={{
				paddingVertical: 1,
				flex: 1,
				justifyContent: "flex-start",
				alignItems: "flex-start",
			}}>
				<Text size={TEXT_SIZE_2_EXTRA_SMALL}>
					{translated_name}
				</Text>
			</View>
		}

		return (
			<View style={{
				flexDirection: "row",
				alignItems: "flex-start",
				justifyContent: "flex-start",
				flex: 1,
				marginVertical: 1,
			}}>
				<MarkingIconOrShortCodeWithTextSize markingId={marking.id} textSize={TEXT_SIZE_2_EXTRA_SMALL} />
				{renderedTranslation}
			</View>
		)
	}

	function renderRowForFoodoffer({
		textForCategoryColumn,
		textForFoodnameColumn,
		elementForMarkingsColumn,
		textForKcalColumn,
		textForFatAndSaturatedFatColumn,
		textForCarbohydratesAndSugarColumn,
		textForProteinColumn,
		textForSaltColumn,
		textForPriceColumn,
		backgroundColor,
		textColor,
		textBold = false,
		paddingVertical = 2,
		paddingHorizontal = 2,
								   }: {
		textForCategoryColumn: string | null | undefined;
		textForFoodnameColumn: string | null | undefined;
		elementForMarkingsColumn: any;
		textForKcalColumn: string | null | undefined;
		textForFatAndSaturatedFatColumn: string | null | undefined;
		textForCarbohydratesAndSugarColumn: string | null | undefined;
		textForProteinColumn: string | null | undefined;
		textForSaltColumn: string | null | undefined;
		textForPriceColumn: string | null | undefined;
		backgroundColor: string | null | undefined;
		textColor: string | null | undefined;
		textBold?: boolean;
		paddingVertical?: number;
		paddingHorizontal?: number;
	}) {
		const designWidthFlex = 1792
		const designWidthCategory = 172
		const designWidthFoodname = 570
		const designWidthMarkings = 450
		const designWidthKcal = 100
		const designWidthFatAndSaturatedFat = 150
		const designWidthCarbohydratesAndSugar = 100
		const designWidthProtein = 50
		const designWidthSalt = 50
		const designWidthPrice = 150

		const textSize = TEXT_SIZE_EXTRA_SMALL;

		return (
			<View style={{
				backgroundColor: backgroundColor,
				width: '100%',
				flexDirection: "row",
				justifyContent: "flex-start",
			}}>
				<View style={{
					flex: designWidthCategory,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold} style={{
						color: textColor,
					}} size={textSize} >
						{textForCategoryColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthFoodname,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForFoodnameColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthMarkings,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					{elementForMarkingsColumn}
				</View>
				<View style={{
					flex: designWidthKcal,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForKcalColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthFatAndSaturatedFat,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForFatAndSaturatedFatColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthCarbohydratesAndSugar,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForCarbohydratesAndSugarColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthProtein,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForProteinColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthSalt,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForSaltColumn}
					</Text>
				</View>
				<View style={{
					flex: designWidthPrice,
					paddingVertical: paddingVertical,
					paddingHorizontal: paddingHorizontal,
				}}>
					<Text bold={textBold}  style={{
						color: textColor,
					}} size={textSize} >
						{textForPriceColumn}
					</Text>
				</View>
			</View>
		)
	}

	// Render individual food offers
	const renderFoodOffer = ({
		foodOffer,
		index,
							 }: { foodOffer: Foodoffers; index: number }) => {

		const isEven = index % 2 === 0;
		let backgroundColor = isEven ? viewBackgroundColorLighter : viewBackgroundColor;
		const textColor = isEven ? viewBackgroundColorLighterContrast : viewContrastColor;
		const food = foodOffer.food;
		let category: string | null | undefined = null;
		if(!!food && typeof food !== "string"){
			category = food.category;
		}
		const priceText = formatPrice(foodOffer.price_student)+" / "+formatPrice(foodOffer.price_employee)+" / "+formatPrice(foodOffer.price_guest);
		const foodName = getFoodName(food, languageCode);

		return (
			<View
				key={index}
				style={{
					width: "100%",
					backgroundColor: backgroundColor,
				}}
				onLayout={(event) => onFoodOfferLayout(event, index)}
			>
				{
					renderRowForFoodoffer({
						textForCategoryColumn: category,
						textForFoodnameColumn: foodName,
						elementForMarkingsColumn: renderMarkingsForFoodRow(foodOffer),
						textForKcalColumn: FoodInformationValueFormatter.formatFoodInformationValueCalories(foodOffer, translation_no_value),
						textForFatAndSaturatedFatColumn: FoodInformationValueFormatter.formatFoodInformationValueFat(foodOffer, translation_no_value) + " / " + FoodInformationValueFormatter.formatFoodInformationValueSaturatedFat(foodOffer, translation_no_value),
						textForCarbohydratesAndSugarColumn: FoodInformationValueFormatter.formatFoodInformationValueCarbohydrates(foodOffer, translation_no_value) + " / " + FoodInformationValueFormatter.formatFoodInformationValueSugar(foodOffer, translation_no_value),
						textForProteinColumn: FoodInformationValueFormatter.formatFoodInformationValueProtein(foodOffer, translation_no_value),
						textForSaltColumn: FoodInformationValueFormatter.formatFoodInformationValueSalt(foodOffer, translation_no_value),
						textForPriceColumn: priceText,
						backgroundColor: backgroundColor,
						textColor: textColor,
						paddingHorizontal: 7,
						paddingVertical: 2
					})
				}
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
				}}
				onContentSizeChange={(contentWidth, contentHeight) => {
					if (contentHeight <= layout.height) {
						// No need to scroll if content fits within the view
						setCurrentIndex(0);
					}
				}}
			>
				{foodOffers.map((offer, index) => renderFoodOffer({
					foodOffer: offer,
					index: index
				}))}
			</ScrollView>
		);
	}

	function renderContent(){
		const renderedMarkings = [];
		for (let i = 0; i < sortedMarkingsList.length; i++) {
			const marking = sortedMarkingsList[i];
			renderedMarkings.push(renderMarking(marking, true));
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
					paddingHorizontal: 10,
					paddingVertical: 10,
				}}>
					<Text bold={true} size={TEXT_SIZE_3_EXTRA_LARGE}>
						{canteen_name}
					</Text>
					<Text bold={true}>
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
			<View style={{
				width: '100%',
				backgroundColor: "blue",
			}}>
				{renderRowForFoodoffer({
					textForCategoryColumn: translation_category,
					textForFoodnameColumn: translation_foodname,
					elementForMarkingsColumn: <Text bold={true} size={TEXT_SIZE_EXTRA_SMALL} style={{
						color: foodAreaContrastColor,
					}}>{translation_markings}</Text>,
					textForKcalColumn: translation_kcal,
					textForFatAndSaturatedFatColumn: translation_nutrition_fat + " / " + translation_nutrition_saturated_fat,
					textForCarbohydratesAndSugarColumn: translation_nutrition_nutrition_carbohydrate + " / " + translation_nutrition_sugar,
					textForProteinColumn: translation_nutrition_protein,
					textForSaltColumn: translation_nutrition_salt,
					textForPriceColumn: translation_price_group_student + " / " + translation_price_group_employee + " / " + translation_price_group_guest,
					backgroundColor: foodAreaColor,
					textColor: foodAreaContrastColor,
					textBold: true,
					paddingVertical: 7,
					paddingHorizontal: 7,
				})}
			</View>
			<View style={{
				flex: 1,
				width: '100%',
				overflow: "hidden",
			}}>
				{renderPaginatedFoodoffers()}
			</View>
			<View style={{
				width: '100%',
				height: 2,
				backgroundColor: foodAreaColor
			}}>
			</View>
			<View style={{
				width: '100%',
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