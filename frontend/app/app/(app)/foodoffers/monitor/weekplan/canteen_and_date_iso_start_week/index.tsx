import React, {useEffect, useState} from 'react';
import {
	getLineHeightInPixelBySize,
	Heading,
	MySpinner,
	Text,
	TEXT_SIZE_EXTRA_SMALL,
	useViewBackgroundColor,
	View
} from '@/components/Themed';
import {router, useGlobalSearchParams} from 'expo-router';
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useIsDemo} from "@/states/SynchedDemo";
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {DateHelper} from "@/helper/date/DateHelper";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useProfileLanguageCode, useProfileLocaleForJsDate, useSynchedProfileCanteen} from "@/states/SynchedProfile";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {ErrorGeneric} from "@/compositions/errors/ErrorGeneric";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {useProjectColor} from "@/states/ProjectInfo";
import {MyScreenHeaderCustom} from "@/components/drawer/MyScreenHeader";
import {SEARCH_PARAM_FULLSCREEN, useIsFullscreenModeFromSearchParam} from "@/states/DrawerSyncConfig";
import {ExpoRouter} from "@/.expo/types/router";
import {IconNames} from "@/constants/IconNames";
import {MyButton} from "@/components/buttons/MyButton";
import MyPrintComponent from "@/components/printComponent/MyPrintComponent";
import {MySafeAreaViewForScreensWithoutHeader} from "@/components/MySafeAreaViewForScreensWithoutHeader";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {FoodOfferCategoriesHelper, useSynchedFoodoffersCategoriesDict} from "@/states/SynchedFoodoffersCategories";
import {getRouteToWeekplanCanteen} from "@/app/(app)/foodoffers/monitor/weekplan/canteens";

const CATEGORY_UNKNOWN = "Ohne Kategorie"

export const SEARCH_PARAM_DATE_ISO = 'date_iso';

export function getRouteToFoodplanCanteenAndDateIsoStartWeek(canteen_id: string, date_start_week_iso_or_undefined: string | undefined): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SearchParams.CANTEENS_ID+"="+canteen_id : null;
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let paramForDate = date_start_week_iso_or_undefined ? SEARCH_PARAM_DATE_ISO+"="+date_start_week_iso_or_undefined : null;
	if(paramForDate){
		paramsRaw.push(paramForDate)
	}

	let params = paramsRaw.join("&")
	return `/(app)/foodoffers/monitor/weekplan/canteen_and_date_iso_start_week/?${params}` as ExpoRouter.Href;
}

export function useDateIsoFromLocalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_DATE_ISO]?: string }>();
	return params[SEARCH_PARAM_DATE_ISO];
}

export default function FoodplanScreen() {
	const [canteen, setCanteen] = useSynchedProfileCanteen();
	const param_date_start_week_iso_or_undefined_for_auto_update: string | undefined = useDateIsoFromLocalSearchParams()
	const isDemo = useIsDemo();
	const AMOUNT_DAYS = 7;
	const viewBackgroundColor = useViewBackgroundColor();
	const projectColor = useProjectColor();
	const projectContrastColor = useMyContrastColor(projectColor);
	const viewContrastColor = useMyContrastColor(viewBackgroundColor);
	const textColorForViewContrastColor = useMyContrastColor(viewContrastColor)
	const translation_weekday = useTranslation(TranslationKeys.weekday)
	const localeForJsDate = useProfileLocaleForJsDate()
	const [languageCode, setLanguageCode] = useProfileLanguageCode();
	const translation_foodweekplan = useTranslation(TranslationKeys.foodweekplan)
	const isFullScreenMode = useIsFullscreenModeFromSearchParam();
	const [printCallback, setPrintCallback] = useState<() => void>();

	const sortedFoodofferCategories = FoodOfferCategoriesHelper.useSortedFoodofferCategories();
	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()

	const foodsAreaColor = useFoodsAreaColor();

	const DEFAULT_PADDING = 10;

	const translation_fullscreen = "Fullscreen"
	const translation_fullscreen_exit = "Exit Fullscreen"
	const translation_print = "Drucken"

	function getStartDateIsoString(date_start_week_iso_or_undefined_for_auto_update: string | undefined): string{
		if(!date_start_week_iso_or_undefined_for_auto_update || date_start_week_iso_or_undefined_for_auto_update===""){
			let today = new Date()
			today.setHours(11,0,0,0); // prevent retriggering of useEffect on every render when milliseconds change
			let monday = DateHelper.getPreviousMonday(today);
			return monday.toISOString();
		}
		let date = new Date(date_start_week_iso_or_undefined_for_auto_update);
		date.setHours(11,0,0,0); // prevent retriggering of useEffect on every render when milliseconds change
		return date.toISOString();
	}

	const [date_start_week_iso, setDateStartWeekIso] = useState<string>(getStartDateIsoString(param_date_start_week_iso_or_undefined_for_auto_update));
	const [fetchingNewDate, setFetchingNewDate] = useState<boolean>(false);


	type DataItem = { date_iso: string, offers: Foodoffers[] | undefined }
	const [weekOffers, setWeekOffers] = useState<DataItem[] | undefined | null>(undefined);

	let doesFoodofferWithoutCategoryExist = false;
	for(let weekOffer of weekOffers || []){
		for(let offer of weekOffer.offers || []){
			if(!offer.foodoffer_category){
				doesFoodofferWithoutCategoryExist = true;
				console.log("Foodoffer without category found")
				console.log(offer)
				break;
			}
		}
		if(doesFoodofferWithoutCategoryExist){
			break;
		}
	}


	async function loadWeekOffers(){
		console.log("loadWeekOffers");
		console.log("caneen: "+canteen);
		if(!!canteen){
			try{
				setFetchingNewDate(true);
				let nextWeekOffers: DataItem[] = [];
				let startDate = new Date(date_start_week_iso+"");
				let tempDate = new Date(startDate);
				for(let i=0; i<AMOUNT_DAYS; i++){
					console.log("Load offers for index: "+i)
					const copyDate = new Date(tempDate.toISOString());
					console.log(copyDate.toISOString());
					let offers = await getFoodOffersForSelectedDate(isDemo, copyDate, canteen)

					nextWeekOffers.push({
						date_iso: copyDate.toISOString(),
						offers: offers
					});
					tempDate = DateHelper.addDays(tempDate, 1);
				}
				setFetchingNewDate(false);
				setWeekOffers(nextWeekOffers);
			} catch (err: any){
				setWeekOffers(null);
			}
		} else {
			setWeekOffers(null)
		}
	}

	useEffect(() => {
		console.log("useEffect")
		loadWeekOffers()
	}, [canteen?.id, date_start_week_iso, isDemo])

	// useEffect to check every minute if the date changed
	useEffect(() => {
		console.log("useEffect for date change")
		const INTERVAL_IN_MINUTES = 10;
		const INTERVAL = INTERVAL_IN_MINUTES * 60 * 1000;
		const interval = setInterval(() => {
			console.log("Check if date changed")
			let newDateIso = getStartDateIsoString(param_date_start_week_iso_or_undefined_for_auto_update);
			if(newDateIso!==date_start_week_iso){
				console.log("Date changed, loading new week offers")
				setDateStartWeekIso(newDateIso);
			}
		}, INTERVAL);
		return () => clearInterval(interval);
	}, [date_start_week_iso, param_date_start_week_iso_or_undefined_for_auto_update]);

	// useEffect to load every 1 minutes the new offers
	useEffect(() => {
		console.log("useEffect for fetching new date")
		const INTERVAL_IN_MINUTES = 1;
		let INTERVAL = INTERVAL_IN_MINUTES * 60 * 1000;
		//INTERVAL = 1000; // for testing
		const interval = setInterval(() => {
			console.log("Check if new date should be fetched")
			loadWeekOffers();
		}, INTERVAL);
		return () => clearInterval(interval);
	}, []);

	const FLEX_WEEKDAY = 1;
	const FLEX_CATEGORIES = 10;

	function renderHeaderRow(){
		let renderedCategories = [];
		for(let category of sortedFoodofferCategories){
			renderedCategories.push(
				<View style={{flex: 1, padding: DEFAULT_PADDING}}>
					<Text style={{color: projectContrastColor}}>{category.alias}</Text>
				</View>
			)
		}
		// add CATEGORY_UNKNOWN
		if(doesFoodofferWithoutCategoryExist){
			renderedCategories.push(
				<View style={{flex: 1, padding: DEFAULT_PADDING}}>
					<Text style={{color: projectContrastColor}}>{CATEGORY_UNKNOWN}</Text>
				</View>
			)
		}

		return <View>
			<View style={{width: "100%", justifyContent: "space-between", alignItems: "center", flexDirection: "row"
			}}>
				<View style={{paddingHorizontal: DEFAULT_PADDING}}>
					<Heading>{canteen?.alias}</Heading>
				</View>
				<View>
					{renderExitFullScreenButton()}
				</View>
			</View>
			<View style={{backgroundColor: projectColor, width: "100%", flexDirection: "row"}}>
				<View style={{flex: FLEX_WEEKDAY}}>
					<View style={{flex: 1, padding: DEFAULT_PADDING}}>
						<Text style={{color: projectContrastColor}}>{translation_weekday}</Text>
					</View>
				</View>
				<View style={{flex: FLEX_CATEGORIES, flexDirection: "row"}}>
					{renderedCategories}
				</View>
			</View>
		</View>
	}

	function renderFoodoffer(offer: Foodoffers){
		let food = offer.food;
		let title = getFoodName(food, languageCode)

		const formated_price_student = formatPrice(offer.price_student);
		const formated_price_employee = formatPrice(offer.price_employee);
		const formated_price_guest = formatPrice(offer.price_guest);
		const formated_prices = [formated_price_student, formated_price_employee, formated_price_guest];
		const price_information = formated_prices.join(" / ");

		return <View style={{
			flex: 1,
			marginBottom: 5,
		}}>
			<View style={{}}>
				<Text style={{
					// height between multiple lines
					lineHeight: getLineHeightInPixelBySize(TEXT_SIZE_EXTRA_SMALL),
				}} size={TEXT_SIZE_EXTRA_SMALL}
					  numberOfLines={3}
				>{title}</Text>
				<Text size={TEXT_SIZE_EXTRA_SMALL} numberOfLines={2}>{price_information}</Text>
			</View>
		</View>
	}

	function renderFoodoffersForRow(offers: Foodoffers[] | undefined){
		if(!offers){
			return null;
		}

		let output = [];

		let foodOffersInCategories: {[key: string]: Foodoffers[]} = {};

		for(let offer of offers){
			let category = FoodOfferCategoriesHelper.getFoodoffersFoodofferCategory(offer, foodoffersCategoriesDict);
			let categoryId = category?.id || CATEGORY_UNKNOWN;
			if(!foodOffersInCategories[categoryId]){
				foodOffersInCategories[categoryId] = [];
			}
			if(categoryId===CATEGORY_UNKNOWN){
				console.log("CATEGORY_UNKNOWN")
				console.log(offer)
			}
			foodOffersInCategories[categoryId].push(offer);
		}
		console.log("foodOffersInCategories")
		console.log(foodOffersInCategories)

		for(let category of sortedFoodofferCategories){
			let foodOffers = foodOffersInCategories[category.id];
			if(!foodOffers){
				foodOffers = [];
			}
			let renderedOffers = [];
			for(let offer of foodOffers){
				renderedOffers.push(renderFoodoffer(offer));
			}
			output.push(
				<View style={{
					flex: 1,
					flexDirection: "column",
					paddingHorizontal: DEFAULT_PADDING
				}}>
					{renderedOffers}
				</View>
			)
		}
		// add offers with CATEGORY_UNKNOWN
		if(doesFoodofferWithoutCategoryExist){
			console.log("Render offers with CATEGORY_UNKNOWN")
			let foodOffers = foodOffersInCategories[CATEGORY_UNKNOWN] || [];
			let renderedOffers = [];
			for(let offer of foodOffers){
				renderedOffers.push(renderFoodoffer(offer));
				console.log("Rendered offer with CATEGORY_UNKNOWN")
				console.log(offer)
			}
			output.push(
				<View style={{
					flex: 1,
					flexDirection: "column",
					paddingHorizontal: DEFAULT_PADDING
				}}>
					{renderedOffers}
				</View>
			)
		}


		return (
			output
		)
	}

	function renderOffersForDayRow(iso_date: string, offers: Foodoffers[] | undefined){
		const date = new Date(iso_date);
		let weekdayName = DateHelper.getWeekdayNameByDate(date, localeForJsDate, true)
		let weekdayDate = DateHelper.formatOfferDateToReadable(date, false, false);

		return <View style={{width: "100%", borderBottomColor: viewContrastColor, borderBottomWidth: 1, flexDirection: "row"}}>
			<View style={{flex: FLEX_WEEKDAY}}>
				<View style={{
					padding: DEFAULT_PADDING,
				}}>
					<Heading>{weekdayName}</Heading>
					<Text>{weekdayDate}</Text>
				</View>
			</View>
			<View style={{flex: FLEX_CATEGORIES, flexDirection: "row"}}>
				{renderFoodoffersForRow(offers)}
			</View>
		</View>
	}

	function renderWeekOffers(){
		let output = [];

		output.push(renderHeaderRow());
		if(!!weekOffers){
			for(let i=0; i<weekOffers.length; i++){
				let dayItem = weekOffers[i];
				const iso_date = dayItem.date_iso;
				output.push(renderOffersForDayRow(iso_date, dayItem.offers));
			}
		}
		if(weekOffers===undefined){
			output.push(<MySpinner />)
		}
		if(weekOffers===null){
			output.push(<ErrorGeneric color={foodsAreaColor} />)
		}

		return output;
	}

	function renderFullScreenButton(){
		return <MyButton useOnlyNecessarySpace={true} tooltip={translation_fullscreen} accessibilityLabel={translation_fullscreen} useTransparentBorderColor={true} leftIcon={IconNames.fullscreen_icon} onPress={() => {
			let routeToThisScreen = getRouteToFoodplanCanteenAndDateIsoStartWeek(canteen?.id+"", param_date_start_week_iso_or_undefined_for_auto_update);
			routeToThisScreen+="&"+SEARCH_PARAM_FULLSCREEN+"=true";
			router.push(routeToThisScreen);
		}} />
	}

	function renderExitFullScreenButton(){
		if(isFullScreenMode){
			return <MyButton useOnlyNecessarySpace={true} tooltip={translation_fullscreen} accessibilityLabel={translation_fullscreen_exit} useTransparentBorderColor={true} leftIcon={IconNames.fullscreen_exit_icon} onPress={() => {
				let routeToThisScreen = getRouteToFoodplanCanteenAndDateIsoStartWeek(canteen?.id+"", param_date_start_week_iso_or_undefined_for_auto_update);
				router.push(routeToThisScreen);
			}} />
		}
	}

	function renderScreenshotButton(){
		return <MyButton useOnlyNecessarySpace={true} tooltip={translation_print} accessibilityLabel={translation_print} useTransparentBorderColor={true} leftIcon={IconNames.print_icon} onPress={() => {
			if (printCallback) {
				printCallback();
			}
		}} />
	}

	function renderWeekSelection(){
		if(!!canteen){
			let route = getRouteToWeekplanCanteen(canteen.id);
			return <MyButton useOnlyNecessarySpace={true} tooltip={"Wochen Auswahl"} accessibilityLabel={"Wochen Auswahl"} useTransparentBorderColor={true} leftIcon={IconNames.calendar_icon} onPress={() => {
				router.push(route);
			}} />
		}
	}

	function renderLoadingStatus(){
		if(fetchingNewDate){
			return <MySpinner size={"small"} />
		}
	}

	function renderSecondaryHeader(){
		return <View style={{flexDirection: "row"}}>
			{renderLoadingStatus()}
			{renderWeekSelection()}
			{renderScreenshotButton()}
			{renderFullScreenButton()}
		</View>
	}

	let header: any = <MyScreenHeaderCustom title={translation_foodweekplan} showBackButton={false} secondaryHeaderContent={renderSecondaryHeader()} />
	if(isFullScreenMode){
		header = null;
	}

	return (
		<MySafeAreaViewForScreensWithoutHeader>
			{header}
				<MyScrollView>
					<MyPrintComponent setPrintCallback={setPrintCallback}>
						<View style={{
							backgroundColor: viewBackgroundColor, // for print mode, otherwise the background color from parent is not rendered
						}}>
							{renderWeekOffers()}
						</View>
					</MyPrintComponent>
				</MyScrollView>
		</MySafeAreaViewForScreensWithoutHeader>
	);
}