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
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
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
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {CompanyLogo} from "@/components/project/CompanyLogo";
import {MyProgressbar} from "@/components/progressbar/MyProgressbar";
import {MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";
import {getCanteenName} from "@/compositions/resourceGridList/canteenGridList";
import {DateHelper} from "@/helper/date/DateHelper";

export const SEARCH_PARAM_CATEGORY = 'category';
export const SEARCH_PARAM_NEXT_FOOD_INTERVAL = 'nextFoodIntervalInSeconds';
export const SEARCH_PARAM_REFRESH_FOOD_OFFERS_INTERVAL = 'refreshFoodOffersIntervalInSeconds';

export function getRouteToFoodBigScreen(canteen_id: string, category: string | null | undefined, nextFoodIntervalInSeconds: number | null | undefined, fullscreen: boolean): ExpoRouter.Href {
	let paramsRaw = []
	let paramForCanteen = canteen_id ? SearchParams.CANTEENS_ID+"="+encodeURIComponent(canteen_id) : null;
	if(paramForCanteen){
		paramsRaw.push(paramForCanteen)
	}
	let paramForCategory = category ? SEARCH_PARAM_CATEGORY+"="+encodeURIComponent(category) : null;
	if(paramForCategory){
		paramsRaw.push(paramForCategory)
	}
	let paramForNextFoodInterval = nextFoodIntervalInSeconds ? SEARCH_PARAM_NEXT_FOOD_INTERVAL+"="+encodeURIComponent(nextFoodIntervalInSeconds) : null;
	if(paramForNextFoodInterval){
		paramsRaw.push(paramForNextFoodInterval)
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

const MarkingInformationList: React.FC<{markingIds: string[], textSize: TextSizeType | undefined}> = ({markingIds, textSize}) => {

	//return null;
	console.log("MarkingInformationList", markingIds)

	let renderedMarkings: any[] = [];
	for(let markingId of markingIds) {
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

	const timeHumanReadable = DateHelper.useCurrentTimeForDate();

	const [canteen, setCanteen] = useSynchedProfileCanteen();
	console.log(canteen)
	const canteen_name = getCanteenName(canteen);

	const category = useFoodCategoryFromLocalSearchParams();

	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams() || 10;
	const refreshFoodOffersIntervalInSeconds = useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const [layout, setLayout] = useState({width: 0, height: 0});
	const [food_index, setFoodIndex] = useState(0);
	const [foodofferReloadKey, setFoodofferReloadKey] = useState<string>("");

	const [foodOfferDateHumanReadable, setFoodOfferDateHumanReadable] = useState<string | null>(null);

	const translation_markings = useTranslation(TranslationKeys.markings)

	const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
	const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
	const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

	const isDemo = useIsDemo();

	const [foodOffers, setFoodOffers] = useState<Foodoffers[]>([]);
	const [loading, setLoading] = useState(true);

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

	function getFoodOffersForCategory(category: string | null | undefined): Foodoffers[] {
		if(!category){
			return foodOffers;
		}
		let filteredFoodOffers: Foodoffers[] = [];
		for(let offer of foodOffers){
			const food: Foods | undefined = offer?.food as Foods | undefined;
			if(food?.category === category){
				filteredFoodOffers.push(offer);
			}
		}

		return filteredFoodOffers
	}

	const foodOffersForCategory = getFoodOffersForCategory(category);
	const currentFoodOfferForCategory = foodOffersForCategory[food_index];



	// Load foodOffers and markings every 5 minutes
	const INTERVAL = refreshFoodOffersIntervalInSeconds * 1000;
	useEffect(() => {
		loadFoodOffers();
		const interval = setInterval(async () => {
			await cacheHelperObjMarkings.updateFromServer();
			await loadFoodOffers();
			setFoodofferReloadKey(""+Date.toString());
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

		const markingsIds = MarkingHelper.getFoodOfferMarkingIds(currentFoodOfferForCategory);

		const priceStudent: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Student));
		const priceEmployee: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Employee));
		const priceGuest: string = formatPrice(getPriceForPriceGroup(currentFoodOfferForCategory, PriceGroups.Guest));

		const assetId = food?.image;
		const image_url = food?.image_remote_url;
		const thumbHash = food?.image_thumb_hash;

		const foodName = getFoodName(food, languageCode);
		const accessibilityLabel = foodName || "Food Image";

		let divider = <View style={{
			width: '100%',
			alignItems: 'center',
			justifyContent: 'center',
		}}>
			<View style={{
				height: 1,
				borderRadius: 2,
				width: '15%',
				backgroundColor: lightContrastColor
			}} />
		</View>
		divider = null;

		// 16:9

		// 425 height
		// 150 logo

		const designHeight = 425;
		const designHeightLogo = 100;
		const designHeightContent = designHeight - designHeightLogo;


		return <View style={{
			width: '100%',
			height: '100%',
			flexDirection: flexDirection
		}}>
			<View style={{
				flex: 1
			}}>
				<View style={{
					width: '100%',
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
								{foodOfferDateHumanReadable}{" - "}{timeHumanReadable}
							</Text>
						</View>
					</View>
					<View style={{
						width: '100%',
						height: 2,
					}}>
						<MyProgressbar key={""+food_index} duration={nextFoodIntervalInSeconds} color={foodAreaColor} />
					</View>
				</View>
				{divider}
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
								{category ? category+":" : ""}
							</Text>
							<Text style={{
								width: '100%',
								textAlign: 'right'
							}} size={TEXT_SIZE_3_EXTRA_LARGE} numberOfLines={3} bold={true}>
								{foodName}
							</Text>
						</View>
						{divider}
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
						{divider}
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
				<View style={{
					height: 2,
					width: '100%',
				}}>
					<MyProgressbar duration={refreshFoodOffersIntervalInSeconds} color={foodAreaColor} backgroundColor={foodAreaContrastColor} key={foodofferReloadKey+""}/>
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
		}} onLayout={(event) => {
			const {width, height} = event.nativeEvent.layout;
			setLayout({width, height});
		}}>
			{renderContent(currentFoodOfferForCategory)}
		</View>
	</MySafeAreaView>
}