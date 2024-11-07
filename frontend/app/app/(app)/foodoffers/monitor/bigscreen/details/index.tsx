import {ExpoRouter} from "@/.expo/types/router";
import {useLocalSearchParams} from "expo-router";
import {
	Text,
	TEXT_SIZE_3_EXTRA_LARGE,
	TEXT_SIZE_5_EXTRA_LARGE,
	TEXT_SIZE_EXTRA_LARGE,
	TextSizeType,
	useViewBackgroundColor,
	View
} from "@/components/Themed";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import React, {useEffect, useState} from "react";
import {
	Foodoffers,
	FoodoffersCategories,
	Foods,
	FoodsCategories,
	Markings
} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import ImageWithComponents from "@/components/project/ImageWithComponents";
import {Rectangle} from "@/components/shapes/Rectangle";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {PriceGroups, useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {AssetHelperTransformOptions} from "@/helper/database/assets/AssetHelperDirectus";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {getPriceForPriceGroup} from "@/components/pricing/useProfilePricing";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {useSortedMarkings, useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {CompanyLogo} from "@/components/project/CompanyLogo";
import {MyProgressbar} from "@/components/progressbar/MyProgressbar";
import {MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";
import {getCanteenName} from "@/compositions/resourceGridList/canteenGridList";
import {DateHelper} from "@/helper/date/DateHelper";
import {FoodOfferCategoriesHelper, useSynchedFoodoffersCategoriesDict} from "@/states/SynchedFoodoffersCategories";
import {HumanReadableTimeText} from "@/app/(app)/foodoffers/monitor/dayplan/details";
import {FoodsCategoriesHelper, useSynchedFoodsCategoriesDict} from "@/states/SynchedFoodsCategories";
import {MonitorHeader} from "@/compositions/monitor/MonitorHeader";

export const SEARCH_PARAM_CATEGORY_LEGACY = 'category';

export const SEARCH_PARAM_FOODOFFERCATEGORYIDS = 'foodOfferCategoryIds';
export const SEARCH_PARAM_SHOW_FOODOFFERCATEGORY_NAME = 'showFoodofferCategoryName';
export const SEARCH_PARAM_FOODCATEGORYIDS = 'foodCategoryIds';
export const SEARCH_PARAM_SHOW_FOODCATEGORY_NAME = 'showFoodCategoryName';
export const SEARCH_PARAM_NEXT_FOOD_INTERVAL = 'nextFoodIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL = 'refreshFoodOffersIntervalInSeconds';

export function getRouteToFoodBigScreen(canteen_id: string, foodofferCategoryIds: string[], showFoodofferCategoryName: boolean , foodCategoryIds: string[], showFoodCategoryName: boolean, nextFoodIntervalInSeconds: number | null | undefined, refreshFoodOffersIntervalInSeconds: number | null | undefined,	fullscreen: boolean): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SearchParams.CANTEENS_ID+"="+encodeURIComponent(canteen_id) : null;
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let paramForCategory = SEARCH_PARAM_FOODOFFERCATEGORYIDS+"="+encodeURIComponent(foodofferCategoryIds.join(","))
	if(paramForCategory){
		paramsRaw.push(paramForCategory)
	}
	let paramForShowFoodofferCategoryName = SEARCH_PARAM_SHOW_FOODOFFERCATEGORY_NAME+"="+encodeURIComponent(showFoodofferCategoryName)
	if(paramForShowFoodofferCategoryName){
		paramsRaw.push(paramForShowFoodofferCategoryName)
	}

	let paramForFoodCategory = SEARCH_PARAM_FOODCATEGORYIDS+"="+encodeURIComponent(foodCategoryIds.join(","))
	if(paramForFoodCategory){
		paramsRaw.push(paramForFoodCategory)
	}
	let paramForShowFoodCategoryName = SEARCH_PARAM_SHOW_FOODCATEGORY_NAME+"="+encodeURIComponent(showFoodCategoryName)
	if(paramForShowFoodCategoryName){
		paramsRaw.push(paramForShowFoodCategoryName)
	}

	let paramForNextFoodInterval = nextFoodIntervalInSeconds ? SEARCH_PARAM_NEXT_FOOD_INTERVAL+"="+encodeURIComponent(nextFoodIntervalInSeconds) : null;
	if(paramForNextFoodInterval){
		paramsRaw.push(paramForNextFoodInterval)
	}

	let paramForRefreshFoodOffersInterval = refreshFoodOffersIntervalInSeconds ? SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL+"="+encodeURIComponent(refreshFoodOffersIntervalInSeconds) : null;
	if(paramForRefreshFoodOffersInterval){
		paramsRaw.push(paramForRefreshFoodOffersInterval)
	}

	let paramForFullScreen = fullscreen ? SEARCH_PARAM_FULLSCREEN+"="+encodeURIComponent(fullscreen) : null;
	if(paramForFullScreen){
		paramsRaw.push(paramForFullScreen)
	}

	let paramForKioskMode = SearchParams.KIOSK_MODE+"="+encodeURIComponent(true);
	paramsRaw.push(paramForKioskMode)

	let params = paramsRaw.join("&")
	return `/(app)/foodoffers/monitor/bigscreen/details/?${params}` as ExpoRouter.Href;
}

export function useFoodCategoryLegacyFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_CATEGORY_LEGACY]?: string }>();
	return params[SEARCH_PARAM_CATEGORY_LEGACY];
}

export function useShowFoodofferCategoryNameFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_SHOW_FOODOFFERCATEGORY_NAME]?: string }>();
	let showFoodofferCategoryName = params[SEARCH_PARAM_SHOW_FOODOFFERCATEGORY_NAME];
	if(showFoodofferCategoryName){
		return showFoodofferCategoryName === 'true';
	}
	return true; // default value is true
}

export function useFoodOfferCategoriesFromLocalSearchParams() {
	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()
	const params = useLocalSearchParams<{ [SEARCH_PARAM_FOODOFFERCATEGORYIDS]?: string }>();
	let foodOfferCategoryIds = params[SEARCH_PARAM_FOODOFFERCATEGORYIDS];
	let objects: FoodoffersCategories[] = [];
	if(foodOfferCategoryIds){
		let ids = foodOfferCategoryIds.split(",");
		for(let i=0; i<ids.length; i++){
			let id = ids[i];
			let object = foodoffersCategoriesDict?.[id];
			if(object){
				objects.push(object);
			}
		}
	}
	return objects;
}

export function useShowFoodCategoryNameFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_SHOW_FOODCATEGORY_NAME]?: string }>();
	let showFoodCategoryName = params[SEARCH_PARAM_SHOW_FOODCATEGORY_NAME];
	if(showFoodCategoryName){
		return showFoodCategoryName === 'true';
	}
	return false; // default value is false
}

export function useFoodCategoriesFromLocalSearchParams() {
	const [foodCategoriesDict, setFoodCategoriesDict] = useSynchedFoodsCategoriesDict()
	const params = useLocalSearchParams<{ [SEARCH_PARAM_FOODCATEGORYIDS]?: string }>();
	let foodCategoryIds = params[SEARCH_PARAM_FOODCATEGORYIDS];
	let objects: FoodsCategories[] = [];
	if(foodCategoryIds){
		let ids = foodCategoryIds.split(",");
		for(let i=0; i<ids.length; i++){
			let id = ids[i];
			let object = foodCategoriesDict?.[id];
			if(object){
				objects.push(object);
			}
		}
	}
	return objects;
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

const MarkingInformationList: React.FC<{markingIds: string[], textSize: TextSizeType | undefined}> = ({markingIds, textSize}) => {

	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict()
	let markingsList: Markings[] = [];
	for(let markingId of markingIds){
		const marking = markingsDict?.[markingId];
		if(marking){
			markingsList.push(marking);
		}
	}

	const sortedMarkings = useSortedMarkings(markingsList);

	//return null;
	//console.log("MarkingInformationList", markingIds)

	let renderedMarkings: any[] = [];
	for(let marking of sortedMarkings){
		const markingId = marking.id;
		renderedMarkings.push(
			<MarkingIconOrShortCodeWithTextSize key={markingId+textSize} markingId={markingId} textSize={textSize} />
		)
	}
	return <View style={{
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'flex-end',
		width: '100%',
	}}>
		{renderedMarkings}
	</View>
}

export default function FoodBigScreenScreen() {
	const foods_placeholder_image = useFoodImagePlaceholderAssetId()
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const [markingsDict, setMarkingsDict, cacheHelperObjMarkings] = useSynchedMarkingsDict()

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const lightContrastColor = useLighterOrDarkerColorForSelection(viewContrastColor);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const [canteen, setCanteen] = useSynchedProfileCanteen();
	//console.log(canteen)
	const canteen_name = getCanteenName(canteen);

	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()
	const categoryLegacy = useFoodCategoryLegacyFromLocalSearchParams();
	const foodOfferCategoriesFromParams = useFoodOfferCategoriesFromLocalSearchParams();
	const showFoodofferCategoryName = useShowFoodofferCategoryNameFromLocalSearchParams()

	const [foodsCategoriesDict, setFoodsCategoriesDict] = useSynchedFoodsCategoriesDict()
	const foodCategoriesFromParams = useFoodCategoriesFromLocalSearchParams();
	const showFoodCategoryName = useShowFoodCategoryNameFromLocalSearchParams()

	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams() || 10;
	const refreshFoodOffersIntervalInSeconds = useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const [layout, setLayout] = useState({width: 0, height: 0});
	const [food_index, setFoodIndex] = useState(0);

	const [reloadNumberForData, setReloadNumberForData] = useState(0);


	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(null);

	const translation_markings = useTranslation(TranslationKeys.markings)

	const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
	const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
	const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

	const translation_foods = useTranslation(TranslationKeys.foods)

	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

	const [foodOffersForCategory, setFoodOffersForCategory] = useState<Foodoffers[]>([]);

	async function loadFoodOffers(){
		console.log("loadFoodOffers")
		setLoading(true);
		if(!!canteen){
			const date = new Date();
			console.log("load food offers for date", date)
			let offers = await getFoodOffersForSelectedDate(isDemo, date, canteen)
			setFoodOfferDateHumanReadable(DateHelper.formatOfferDateToReadable(date, true));
			console.log("offers", offers)
			setFoodOffers(offers);
		}
		setLoading(false);
	}

	function filterFoodOffersForFoodofferCategory(categoryLegacy: string | null | undefined, foodOfferCategories: FoodoffersCategories[], foodOffers: Foodoffers[]): Foodoffers[] {
		console.log("filterFoodOffersForFoodofferCategory")
		let filteredFoodOffers: Foodoffers[] = [];
		if(!!categoryLegacy) {
			console.log("categoryLegacy", categoryLegacy)
			for (let offer of foodOffers) {
				const food: Foods | undefined = offer?.food as Foods | undefined;
				if (food?.category === categoryLegacy) {
					filteredFoodOffers.push(offer);
				}
			}
			return filteredFoodOffers
		}

		if(foodOfferCategories.length === 0){
			return foodOffers;
		}


		let filteredFoodoffers: Foodoffers[] = [];
		for(let offer of foodOffers){
			let foodofferCategory = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(offer, foodoffersCategoriesDict);
			if(foodofferCategory){
				for(let selectedCategory of foodOfferCategories){
					if(selectedCategory.id === foodofferCategory.id){
						filteredFoodoffers.push(offer);
					}
				}
			}
		}

		return filteredFoodoffers;
	}

	function filterFoodOffersForFoodCategory(foodCategories: FoodsCategories[], foodOffers: Foodoffers[]): Foodoffers[] {
		if(foodCategories.length === 0){
			return foodOffers;
		}
		let filteredFoodOffers: Foodoffers[] = [];
		for(let offer of foodOffers){
			let food = offer?.food as Foods | undefined;
			let foodCategory = FoodsCategoriesHelper.getFoodsFoodsCategory(food, foodsCategoriesDict);
			if(foodCategory){
				for(let selectedCategory of foodCategories){
					if(selectedCategory.id === foodCategory.id){
						filteredFoodOffers.push(offer);
					}
				}
			}
		}
		return filteredFoodOffers;
	}

	//console.log("category", category)
	//console.log("foodOffersForCategory", foodOffersForCategory)
	const currentFoodOfferForCategory: Foodoffers | undefined = foodOffersForCategory[food_index];


	useEffect(() => {
		console.log("useEffect filter foodoffers")
		let filteredFoodOffersByFoodofferCategory = filterFoodOffersForFoodofferCategory(categoryLegacy, foodOfferCategoriesFromParams, foodOffers);
		let filteredFoodOffersByFoodCategory = filterFoodOffersForFoodCategory(foodCategoriesFromParams, filteredFoodOffersByFoodofferCategory);
		setFoodOffersForCategory(filteredFoodOffersByFoodCategory);
	}, [categoryLegacy, JSON.stringify(foodCategoriesFromParams), JSON.stringify(foodsCategoriesDict), JSON.stringify(foodOfferCategoriesFromParams), JSON.stringify(foodoffersCategoriesDict), JSON.stringify(foodOffers)]);

	// Load foodOffers and markings every 5 minutes
	const INTERVAL = refreshFoodOffersIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(async () => {
			await cacheHelperObjMarkings.updateFromServer();
			await loadFoodOffers();
			setReloadNumberForData((prev) => prev + 1);
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [JSON.stringify(canteen), categoryLegacy, nextFoodIntervalInSeconds, refreshFoodOffersIntervalInSeconds]);


	// UseEffect to increase food_index every nextFoodIntervalInSeconds
	useEffect(() => {
		const interval = setInterval(() => {
			console.log("useEffect nextFoodIntervalInSeconds")
			console.log("food_index", food_index)
			console.log("foodOffersForCategory.length", foodOffersForCategory.length)
			setFoodIndex((food_index) => {
				if(foodOffersForCategory.length === 0){
					return 0;
				}

				let nextIndex = (food_index + 1) % foodOffersForCategory.length;
				// check if nextIndex is NaN
				if(isNaN(nextIndex)){
					return 0;
				}

				return nextIndex;
			});
		}, nextFoodIntervalInSeconds * 1000);
		return () => clearInterval(interval);
	}, [nextFoodIntervalInSeconds, foodOffersForCategory]);


	function renderHeader(food_index: number, foodOffersForCategory: Foodoffers[]){
		const foodPosition = foodOffersForCategory.length > 0 ? (food_index+1) : 0;
		let foodPositionText = (foodPosition)+" / "+foodOffersForCategory.length+" "+translation_foods;
		if(foodOffersForCategory.length === 0){
			foodPositionText = "";
		}

		return(
			<View style={{
				width: '100%',
			}}>
				<MonitorHeader canteen={canteen} dateHumanReadable={foodOfferDateHumanReadable || ""} rightContent={<Text bold={true}>{foodPositionText}</Text>} />
				<View style={{
					width: '100%',
					height: 2,
				}}>
					<MyProgressbar key={""+food_index} duration={nextFoodIntervalInSeconds} color={foodAreaColor} />
				</View>
			</View>
		)
	}

	function renderFoodContent(currentFoodOfferForCategory: Foodoffers, food: Foods){

		const foodofferCategory = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(currentFoodOfferForCategory, foodoffersCategoriesDict);
		let foodofferCategoryName = FoodOfferCategoriesHelper.getFoodofferCategoryName(foodofferCategory, languageCode);
		if(!showFoodofferCategoryName){
			foodofferCategoryName = "";
		}

		const foodName = getFoodName(food, languageCode);

		const foodCategory = FoodsCategoriesHelper.getFoodsFoodsCategory(food, foodsCategoriesDict);
		let foodCategoryName = FoodsCategoriesHelper.getFoodCategoryName(foodCategory, languageCode);
		if(!showFoodCategoryName){
			foodCategoryName = "";
		}

		const designHeight = 425;
		const designHeightLogo = 100;
		const designHeightContent = designHeight - designHeightLogo;

		const markingsIds = MarkingHelper.getFoodOfferMarkingIds(currentFoodOfferForCategory);

		const priceStudent: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Student));
		const priceEmployee: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Employee));
		const priceGuest: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Guest));

		return(
			<View style={{
				flex: designHeightContent,
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				<View style={{
					flex: 1,
					width: '80%',
					paddingTop: 20,
					paddingBottom: 10
				}}>
					<View style={{
						flex: 1,
						width: '100%',
						alignItems: 'flex-end'
					}}>
						<Text style={{
							width: '100%',
							textAlign: 'right'
						}} size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
							{foodofferCategoryName}
						</Text>
						<Text style={{
							width: '100%',
							textAlign: 'right'
						}} size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
							{foodCategoryName}
						</Text>
						<Text style={{
							width: '100%',
							textAlign: 'right'
						}} size={TEXT_SIZE_3_EXTRA_LARGE} numberOfLines={3} bold={true}>
							{foodName}
						</Text>
					</View>
					<View style={{
						flex: 1,
						width: '100%',
					}}>
						<View style={{
							width: '100%',
							alignItems: 'flex-end',
						}}>
							<Text size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
								{translation_price_group_student+":"}
							</Text>
							<Text size={TEXT_SIZE_5_EXTRA_LARGE} bold={true}>
								{priceStudent}
							</Text>
						</View>
						<View style={{
							width: '100%',
							alignItems: 'flex-end',
						}}>
							<Text size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
								{translation_price_group_employee+": "+priceEmployee}
							</Text>
						</View>
						<View style={{
							width: '100%',
							alignItems: 'flex-end',
						}}>
							<Text size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
								{translation_price_group_guest+": "+priceGuest}
							</Text>
						</View>

					</View>
					<View style={{
						flex: 1,
						alignItems: 'flex-end',
						//backgroundColor: "blue"
					}}>
						<View style={{
							width: '100%',
							alignItems: 'flex-end',
						}}>
							<Text size={TEXT_SIZE_EXTRA_LARGE} bold={true}>
								{translation_markings+":"}
							</Text>
						</View>
						<MarkingInformationList  markingIds={markingsIds} textSize={TEXT_SIZE_EXTRA_LARGE} />
					</View>
				</View>
			</View>
		)
	}

	function renderLayout(){
		if(!currentFoodOfferForCategory){
			return(
				renderLayoutForNoFoodoffer()
			)
		} else {
			return(
				renderLayoutForFoodoffer(currentFoodOfferForCategory, food_index, foodOffersForCategory)
			)
		}
	}

	function renderLayoutForNoFoodoffer(){
		return(
			<View style={{
				width: '100%',
				height: '100%',
				flexDirection: "column",
			}}>
				{renderHeader(food_index, foodOffersForCategory)}
				<View style={{
					flex: 1,
					flexGrow: 1,
					width: '100%',
					height: '100%',
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					<CompanyLogo style={{
						height: '100%',
						width: '100%',
					}} />
				</View>
				{renderReloadDataProgress()}
			</View>
		)
	}

	function renderReloadDataProgress(){
		return(
			<View style={{
				height: 2,
				width: '100%',
			}}>
				<MyProgressbar duration={refreshFoodOffersIntervalInSeconds} color={foodAreaColor} backgroundColor={foodAreaContrastColor} key={reloadNumberForData+""}/>
			</View>
		)
	}

	function renderLayoutForFoodoffer(currentFoodOfferForCategory: Foodoffers, food_index: number, foodOffersForCategory: Foodoffers[]) {
		let {width, height} = layout;
		if(!width || !height){
			return <Text>Loading...</Text>
		}
		let flexDirection = width > height ? 'row' : 'column';
		let minimalDimension = Math.min(width, height);

		const food = currentFoodOfferForCategory?.food as Foods;

		const assetId = food?.image;
		const image_url = food?.image_remote_url;
		const thumbHash = food?.image_thumb_hash;


		const accessibilityLabel = "Food Image";

		// 16:9

		// 425 height
		// 150 logo


		return <View style={{
			width: '100%',
			height: '100%',
			flexDirection: flexDirection
		}}>
			<View style={{
				flex: 1
			}}>
				{renderHeader(food_index, foodOffersForCategory)}
				{renderFoodContent(currentFoodOfferForCategory, food)}
				{renderReloadDataProgress()}
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
		}} onLayout={(event) => {
			const {width, height} = event.nativeEvent.layout;
			setLayout({width, height});
		}}>
			{renderLayout()}
		</View>
	</MySafeAreaView>
}