import {ExpoRouter} from "@/.expo/types/router";
import {useLocalSearchParams} from "expo-router";
import {
	MyTextProps,
	Text,
	TEXT_SIZE_2_EXTRA_SMALL,
	TEXT_SIZE_3_EXTRA_LARGE,
	TEXT_SIZE_EXTRA_SMALL,
	useViewBackgroundColor,
	View
} from "@/components/Themed";
import React, {FunctionComponent, useCallback, useEffect, useRef, useState} from "react";
import {Canteens, Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {useSortedMarkings, useSynchedMarkingsDict} from "@/states/SynchedMarkings";
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
import {useSynchedCanteensDict} from "@/states/SynchedCanteens";
import {useIsDebug} from "@/states/Debug";
import {FoodOfferCategoriesHelper, useSynchedFoodoffersCategoriesDict} from "@/states/SynchedFoodoffersCategories";

export const SEARCH_PARAM_NEXT_PAGE_INTERVAL = 'nextPageIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_DATA_INTERVAL = 'refreshDataIntervalInSeconds';

export function getRouteToFoodofferDayplanScreen(canteen_id: string, nextPageIntervalInSeconds: number | null | undefined, refreshDataIntervalInSeconds: number | null |undefined, additionalCanTeenIds?: string[] | null | undefined
): ExpoRouter.Href {
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

	let paramForAdditionalCanteens = additionalCanTeenIds ? SearchParams.MONITOR_ADDITIONAL_CANTEENS_ID+"="+encodeURIComponent(additionalCanTeenIds.join(",")) : null;
	if(paramForAdditionalCanteens){
		paramsRaw.push(paramForAdditionalCanteens)
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

export function useAdditionalCanteensFromLocalSearchParams() {
	const [canteensDict, setCanteensDict] = useSynchedCanteensDict()
	const additionalCanteens: Canteens[] = [];
	const params = useLocalSearchParams<{ [SearchParams.MONITOR_ADDITIONAL_CANTEENS_ID]?: string }>();
	let additionalCanteenIdsString = params[SearchParams.MONITOR_ADDITIONAL_CANTEENS_ID];
	if(additionalCanteenIdsString){
		let additionalCanteenIds = additionalCanteenIdsString.split(",");
		for(let i=0; i<additionalCanteenIds.length; i++){
			let canteenId = additionalCanteenIds[i];
			let canteen = canteensDict?.[canteenId];
			if(canteen){
				additionalCanteens.push(canteen);
			}
		}
	}
	return additionalCanteens
}


const MarkingsRowForFood: FunctionComponent<{foodOffer: Foodoffers}> = ({foodOffer, ...props}) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	let renderedMarkings: any[] = [];
	let foodoffersmarkingJoinElements = foodOffer.markings;
	let unsortedMarkingsForFoodOffer: Markings[] = [];
	if(!!markingsDict){
		for(let i=0; i<foodoffersmarkingJoinElements.length; i++){
			let joinElement = foodoffersmarkingJoinElements[i];
			let markingId = joinElement?.markings_id;
			let marking = markingsDict?.[markingId];
			if(!!marking){
				unsortedMarkingsForFoodOffer.push(marking)
			}
		}
	}

	const sortedMarkingsForFoodOffer = useSortedMarkings(unsortedMarkingsForFoodOffer);

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


export function HumanReadableTimeText({...props}: MyTextProps) {
	const timeHumanReadable = DateHelper.useCurrentTimeForDate();
	return <Text {...props}>
		{timeHumanReadable}
	</Text>
}

export default function FoodDayPlanScreen() {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()

	const [markingsDict, setMarkingsDict, cacheHelperObjMarkings] = useSynchedMarkingsDict()
	let unsortedMarkingList: Markings[] = [];
	if(!!markingsDict){
		let markingKeys = Object.keys(markingsDict);
		for(let i=0; i<markingKeys.length; i++){
			let key = markingKeys[i];
			let marking = markingsDict[key];
			if(marking){
				unsortedMarkingList.push(marking);
			}
		}
	}
	const sortedMarkings = useSortedMarkings(unsortedMarkingList);

	const isDebug = useIsDebug()

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

	const translation_foods = useTranslation(TranslationKeys.foods)

	const [reloadNumberForData, setReloadNumberForData] = useState(0);

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const viewBackgroundColorLighter = useLighterOrDarkerColorForSelection(viewBackgroundColor);
	const viewBackgroundColorLighterContrast = useMyContrastColor(viewBackgroundColorLighter);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const nextPageIntervalInSeconds = useNextPageIntervalInSecondsFromLocalSearchParams() || 10;
	const [reloadNumberForPage, setReloadNumberForPage] = useState(0);

	const refreshDataIntervalInSeconds = useRefreshDataIntervalInSecondsFromLocalSearchParams() || 5 * 60;

	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(null);
	//const timeHumanReadable = DateHelper.useCurrentTimeForDate();

	// Main canteen
	const [canteen, setCanteen] = useSynchedProfileCanteen();
	const canteen_name = getCanteenName(canteen);
	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [layoutMainCanteen, setLayoutMainCanteen] = useState({width: 0, height: 0});
	const scrollViewRefMainCanteen = useRef(null);
	const [currentIndexMainCanteen, setCurrentIndexMainCanteen] = useState(0);
	const [visibleItemsMainCanteen, setVisibleItemsMainCanteen] = useState([]);
	const [itemHeightsMainCanteen, setItemHeightsMainCanteen] = useState([]);

	// Additional canteens
	const additionalCanteens = useAdditionalCanteensFromLocalSearchParams();
	const [additionalFoodOffers, setAdditionalFoodOffers] = useState<Foodoffers[]>([]);
	const [layoutAdditionalCanteens, setLayoutAdditionalCanteens] = useState({width: 0, height: 0});
	const scrollViewRefAdditionalCanteens = useRef(null);
	const [currentIndexAdditionalCanteens, setCurrentIndexAdditionalCanteens] = useState(0);
	const [visibleItemsAdditionalCanteens, setVisibleItemsAdditionalCanteens] = useState([]);
	const [itemHeightsAdditionalCanteens, setItemHeightsAdditionalCanteens] = useState([]);



	// Calculate visible items count
	const calculateVisibleItemsCountMainCanteen = () => {
		if (itemHeightsMainCanteen.length === 0 || layoutMainCanteen.height === 0) return 1;
		const totalHeight = layoutMainCanteen.height;
		let sumHeight = 0;
		let count = 0;

		for (let i = 0; i < itemHeightsMainCanteen.length; i++) {
			sumHeight += itemHeightsMainCanteen[i];
			if (sumHeight > totalHeight) break;
			count++;
		}

		return count;
	};

	const calculateVisibleItemsCountAdditionalCanteens = () => {
		if (itemHeightsAdditionalCanteens.length === 0 || layoutAdditionalCanteens.height === 0) return 1;
		const totalHeight = layoutAdditionalCanteens.height;
		let sumHeight = 0;
		let count = 0;

		for (let i = 0; i < itemHeightsAdditionalCanteens.length; i++) {
			sumHeight += itemHeightsAdditionalCanteens[i];
			if (sumHeight > totalHeight) break;
			count++;
		}

		return count;
	}

	// Auto-Scroll functionality
	useEffect(() => {
		const interval = setInterval(() => {
			console.log("Auto-Scrolling to next page");
			const visibleCountMainCanteen = calculateVisibleItemsCountMainCanteen();
			if (visibleCountMainCanteen > 0 && currentIndexMainCanteen < foodOffers.length) {
				// Scroll to the next set of visible items
				if (scrollViewRefMainCanteen.current) {
					console.log("Main: currentIndexMainCanteen: "+currentIndexMainCanteen)
					console.log("Main: visibleCountMainCanteen: "+visibleCountMainCanteen)
					const nextIndex = currentIndexMainCanteen + visibleCountMainCanteen;
					const nextPosition = visibleItemsMainCanteen[nextIndex] || 0;
					console.log("Main: nextIndex: "+nextIndex)
					console.log("Main: nextPosition: "+nextPosition)
					scrollViewRefMainCanteen.current.scrollTo({ y: nextPosition, animated: false });
					setCurrentIndexMainCanteen((prev) => (nextIndex >= foodOffers.length ? 0 : nextIndex));
				}
			}

			const visibleCountAdditionalCanteens = calculateVisibleItemsCountAdditionalCanteens();
			if (visibleCountAdditionalCanteens > 0 && currentIndexAdditionalCanteens < additionalFoodOffers.length) {
				// Scroll to the next set of visible items
				if (scrollViewRefAdditionalCanteens.current) {
					console.log("Additional: currentIndexAdditionalCanteens: "+currentIndexAdditionalCanteens)
					console.log("Additional: visibleCountAdditionalCanteens: "+visibleCountAdditionalCanteens)
					const nextIndex = currentIndexAdditionalCanteens + visibleCountAdditionalCanteens;
					const nextPosition = visibleItemsAdditionalCanteens[nextIndex] || 0;
					console.log("Additional: nextIndex: "+nextIndex)
					console.log("Additional: nextPosition: "+nextPosition)
					scrollViewRefAdditionalCanteens.current.scrollTo({ y: nextPosition, animated: false });
					setCurrentIndexAdditionalCanteens((prev) => (nextIndex >= additionalFoodOffers.length ? 0 : nextIndex));
				}
			}


			setReloadNumberForPage((prev) => prev + 1);
		}, nextPageIntervalInSeconds * 1000);

		return () => clearInterval(interval);
	}, [visibleItemsMainCanteen, currentIndexMainCanteen, currentIndexAdditionalCanteens, nextPageIntervalInSeconds, itemHeightsMainCanteen, layoutMainCanteen, itemHeightsAdditionalCanteens, layoutAdditionalCanteens]);

	// Function to handle layout of food offers
	const onFoodOfferLayoutMainCanteen = useCallback(
		(event, index) => {
			const { y, height } = event.nativeEvent.layout;
			setVisibleItemsMainCanteen((prev) => {
				const newItems = [...prev];
				newItems[index] = y;
				return newItems;
			});
			setItemHeightsMainCanteen((prev) => {
				const newHeights = [...prev];
				newHeights[index] = height;
				return newHeights;
			});
		},
		[setVisibleItemsMainCanteen, setItemHeightsMainCanteen]
	);

	const onFoodOfferLayoutAdditionalCanteens = useCallback(
		(event, index) => {
			const { y, height } = event.nativeEvent.layout;
			setVisibleItemsAdditionalCanteens((prev) => {
				const newItems = [...prev];
				newItems[index] = y;
				return newItems;
			});
			setItemHeightsAdditionalCanteens((prev) => {
				const newHeights = [...prev];
				newHeights[index] = height;
				return newHeights;
			});
		},
		[setVisibleItemsAdditionalCanteens, setItemHeightsAdditionalCanteens]
	);


	const isDemo = useIsDemo();


	const [loading, setLoading] = useState(true);

	async function loadFoodOffers(){
		setLoading(true);
		if(!!canteen){
			const date = new Date();
			setFoodOfferDateHumanReadable(DateHelper.formatOfferDateToReadable(date, true));
			let newUnsortedFoodoffers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			let newFoodoffers = FoodOfferCategoriesHelper.sortFoodoffersByFoodofferCategory(newUnsortedFoodoffers, foodoffersCategoriesDict);
			setFoodOffers(newFoodoffers);

			let additionalUnsortedFoodOffers = [];
			for(let i=0; i<additionalCanteens.length; i++){
				let additionalCanteen = additionalCanteens[i];
				let additionalFoodoffer = await getFoodOffersForSelectedDate(isDemo, date, additionalCanteen)
				additionalUnsortedFoodOffers.push(...additionalFoodoffer);
			}
			const additionalSortedFoodOffers = FoodOfferCategoriesHelper.sortFoodoffersByFoodofferCategory(additionalUnsortedFoodOffers, foodoffersCategoriesDict);
			setAdditionalFoodOffers(additionalSortedFoodOffers);
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
								 onLayout,
							 }: { foodOffer: Foodoffers; index: number,
		onLayout?: (event: any, index: number) => void
	}) => {

		const isEven = index % 2 === 0;
		let backgroundColor = isEven ? viewBackgroundColorLighter : viewBackgroundColor;
		const textColor = isEven ? viewBackgroundColorLighterContrast : viewContrastColor;
		const food = foodOffer.food;

		let foodOfferCategory = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(foodOffer, foodoffersCategoriesDict);
		let foodOfferCategoryName = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodOfferCategory, languageCode);

		const priceText = formatPrice(foodOffer.price_student)+" / "+formatPrice(foodOffer.price_employee)+" / "+formatPrice(foodOffer.price_guest);
		const foodName = getFoodName(food, languageCode);

		return (
			<View
				key={index}
				style={{
					width: "100%",
					backgroundColor: backgroundColor,
				}}
				onLayout={(event) => {
					if (onLayout) {
						onLayout(event, index);
					}
				}}
			>
				{
					renderRowForFoodoffer({
						textForCategoryColumn: foodOfferCategoryName,
						textForFoodnameColumn: foodName,
						elementForMarkingsColumn: <MarkingsRowForFood foodOffer={foodOffer} />,
						textForKcalColumn: FoodInformationValueFormatter.formatFoodInformationValueCalories(foodOffer),
						textForFatAndSaturatedFatColumn: FoodInformationValueFormatter.formatFoodInformationValueFat(foodOffer) + " / " + FoodInformationValueFormatter.formatFoodInformationValueSaturatedFat(foodOffer),
						textForCarbohydratesAndSugarColumn: FoodInformationValueFormatter.formatFoodInformationValueCarbohydrates(foodOffer) + " / " + FoodInformationValueFormatter.formatFoodInformationValueSugar(foodOffer),
						textForProteinColumn: FoodInformationValueFormatter.formatFoodInformationValueProtein(foodOffer),
						textForSaltColumn: FoodInformationValueFormatter.formatFoodInformationValueSalt(foodOffer),
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

	function renderPaginatedFoodoffersMainCanteen() {
		const content: any = [];

		const amountOffers = foodOffers.length;
		const currentIndex = currentIndexMainCanteen;
		const visibleCount = calculateVisibleItemsCountMainCanteen();
		const nextIndexRaw = currentIndex + visibleCount;
		const amountItemsShown = nextIndexRaw > amountOffers ? amountOffers : nextIndexRaw;


		for (let i = 0; i < amountOffers; i++) {
			const offer = foodOffers[i];
			content.push(renderFoodOffer({
				foodOffer: offer,
				index: i,
				onLayout: onFoodOfferLayoutMainCanteen
			}));
		}

		const maxHeight = additionalFoodOffers.length > 0 ? "50%" : "100%";

		return (
			<View style={{
				width: '100%',
				flexGrow: 0, // Prevent ScrollView from stretching more than it needs
				maxHeight: maxHeight,
				overflow: "hidden",
			}}>
				<View style={{
					width: '100%',
					backgroundColor: foodAreaColor,
					paddingHorizontal: 2,
				}}>
					<Text style={{
						textAlign: "right",
						color: foodAreaContrastColor,
					}}>
						{translation_foods+": "+amountItemsShown+ " / "+amountOffers}
					</Text>
				</View>
				<ScrollView
					ref={scrollViewRefMainCanteen}
					onLayout={(event) => {
						const { width, height } = event.nativeEvent.layout;
						setLayoutMainCanteen({ width, height });
					}}
					style={{
						overflow: "hidden",
						flex: 1,
						//maxHeight: maxHeight,  // Set maximum height to 50% of the container
						//flexGrow: 0, // Prevent ScrollView from stretching more than it needs
					}}
					onContentSizeChange={(contentWidth, contentHeight) => {
						if (contentHeight <= layoutMainCanteen.height) {
							// No need to scroll if content fits within the view
							setCurrentIndexMainCanteen(0);
						}
					}}
				>
					{content}
				</ScrollView>
			</View>
		);
	}

	function renderPaginatedFoodoffersAdditionalCanteens() {
		const content: any = [];
		if (additionalFoodOffers.length <= 0) {
			return null;
		}

		const amountOffers = additionalFoodOffers.length;
		const currentIndex = currentIndexAdditionalCanteens;
		const visibleCount = calculateVisibleItemsCountAdditionalCanteens();
		const nextIndexRaw = currentIndex + visibleCount;
		const amountItemsShown = nextIndexRaw > amountOffers ? amountOffers : nextIndexRaw;

		for (let i = 0; i < additionalFoodOffers.length; i++) {
			const offer = additionalFoodOffers[i];
			content.push(renderFoodOffer({
				foodOffer: offer,
				index: i,
				onLayout: onFoodOfferLayoutAdditionalCanteens
			}));
		}

		return (
			<View style={{
				width: '100%',
				flex: 1,
				overflow: "hidden",
			}}>
				<View style={{
					width: '100%',
					backgroundColor: foodAreaColor,
					paddingHorizontal: 2,
				}}>
					<Text style={{
						textAlign: "right",
						color: foodAreaContrastColor,
					}}>
						{translation_foods+": "+amountItemsShown+ " / "+amountOffers}
					</Text>
				</View>
				<ScrollView
					ref={scrollViewRefAdditionalCanteens}
					onLayout={(event) => {
						const { width, height } = event.nativeEvent.layout;
						setLayoutAdditionalCanteens({ width, height });
					}}
					style={{
						overflow: "hidden",
						flex: 1, // Use the remaining space available,
						//flexGrow: 0, // Prevent ScrollView from stretching more than it needs
					}}
					onContentSizeChange={(contentWidth, contentHeight) => {
						if (contentHeight <= layoutAdditionalCanteens.height) {
							// No need to scroll if content fits within the view
							setCurrentIndexAdditionalCanteens(0);
						}
					}}
				>
					{content}
				</ScrollView>
			</View>
		);
	}


	function renderHeaderRow(){
		return(
			renderRowForFoodoffer({
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
			})
		)
	}

	function renderMarkingsBottom(){
		const renderedMarkings = [];
		for (let i = 0; i < sortedMarkings.length; i++) {
			const marking = sortedMarkings[i];
			renderedMarkings.push(renderMarking(marking, true));
		}

		return <>
			{renderMyGridList({
				children: renderedMarkings,
				amountColumns: 8,
				paddingColumns: 1,
			})}
		</>
	}

	function renderContent(){

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
						{foodOfferDateHumanReadable}{" - "}<HumanReadableTimeText bold={true} />
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
			}}>
				{renderHeaderRow()}
			</View>
			<View style={{
				flex: 1,
				width: '100%',
				overflow: "hidden",
			}}>
				{renderPaginatedFoodoffersMainCanteen()}
				{renderPaginatedFoodoffersAdditionalCanteens()}
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
				{renderMarkingsBottom()}
			</View>
			<View style={{
				width: '100%',
				height: 2,
			}}>
				<MyProgressbar key={""+reloadNumberForData} duration={refreshDataIntervalInSeconds} color={foodAreaColor} />
			</View>
			{renderDebug()}
		</View>
	}

	function renderDebug(){
		if(isDebug){
			return <View style={{
				position: "absolute",
				bottom: 0,
				right: 0,
				width: "50%",
				height: "50%",
				flexDirection: "column",
				alignItems: "flex-end",
			}}>
				<View style={{
					backgroundColor: viewBackgroundColor,
					padding: 10,
				}}>
					<Text>{"Amount visible Main Canteen: "+calculateVisibleItemsCountMainCanteen()}</Text>
					<Text>{"Current Index Main Canteen: "+currentIndexMainCanteen}</Text>
					<Text>{"Amount visible Additional Canteens: "+calculateVisibleItemsCountAdditionalCanteens()}</Text>
					<Text>{"Current Index Additional Canteens: "+currentIndexAdditionalCanteens}</Text>
				</View>
			</View>
		} else {
			return null;
		}
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