import {ExpoRouter} from "@/.expo/types/router";
import {SEARCH_PARAM_CANTEENS_ID, useCanteensIdFromGlobalSearchParams} from "@/app/(app)/foodoffers/weekplan/canteens";
import {useLocalSearchParams} from "expo-router";
import {
	Text,
	TEXT_SIZE_3_EXTRA_LARGE,
	TEXT_SIZE_5_EXTRA_LARGE,
	TEXT_SIZE_EXTRA_LARGE,
	useTextContrastColor,
	useViewBackgroundColor,
	View
} from "@/components/Themed";
import {SEARCH_PARAM_FULLSCREEN} from "@/states/DrawerSyncConfig";
import React, {useEffect, useRef, useState} from "react";
import {Foodoffers, Foods, Markings} from "@/helper/database/databaseTypes/types";
import {useIsDemo} from "@/states/SynchedDemo";
import {getFoodOffersForSelectedDate} from "@/states/SynchedFoodOfferStates";
import {useSynchedCanteenById} from "@/states/SynchedCanteens";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import ImageWithComponents from "@/components/project/ImageWithComponents";
import {Rectangle} from "@/components/shapes/Rectangle";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {PriceGroups, useProfileLanguageCode} from "@/states/SynchedProfile";
import {AssetHelperTransformOptions} from "@/helper/database/assets/AssetHelperDirectus";
import {SearchParams} from "@/helper/searchParams/SearchParams";
import {formatPrice} from "@/components/pricing/PricingBadge";
import {getPriceForPriceGroup} from "@/components/pricing/useProfilePricing";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Animated} from "react-native";
import {useLighterOrDarkerColorForSelection, useMyContrastColor} from "@/helper/color/MyContrastColor";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {getMarkingName} from "@/components/food/MarkingListItem";
import {CompanyLogo} from "@/components/project/CompanyLogo";

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

	let paramForKioskMode = SearchParams.KIOSK_MODE+"="+"true";
	paramsRaw.push(paramForKioskMode)

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

type ProgressBarProps = {
	duration: number,
	color: string,
	backgroundColor?: string
}
const ProgressBar: React.FC<ProgressBarProps> = ({ duration, color, backgroundColor }) => {
	const progress = useRef(new Animated.Value(0)).current;


	if(duration <= 0){
		return null;
	}

	useEffect(() => {
		// Start the animation when the component mounts
		Animated.timing(progress, {
			toValue: 100, // Animate the progress to 100%
			duration: duration * 1000, // Convert duration to milliseconds
			useNativeDriver: false, // useNativeDriver is false because we're animating layout properties
		}).start();
	}, [duration, progress]);

	// Interpolate the animated value to convert it to width percentage
	const widthInterpolation = progress.interpolate({
		inputRange: [0, 100],
		outputRange: ['0%', '100%'],
	});

	return (
		<View style={{
			height: "100%",
			width: "100%",
			overflow: "hidden",
			backgroundColor: backgroundColor
		}}>
			<Animated.View
				style={[
					{
						height: "100%",
						borderBottomRightRadius: 5,
						borderTopRightRadius: 5,
					},
					{ backgroundColor: color, width: widthInterpolation },
				]}
			/>
		</View>
	);
};

const MarkingNamesList: React.FC<{markingIds: string[], markingsDict: Record<string, Markings>, languageCode: string}> = ({markingIds, markingsDict, languageCode}) => {
	const textColor = useTextContrastColor()

	let renderedMarkings: any[] = [];
	for(let markingId of markingIds) {
		const marking: Markings | undefined | null = markingsDict?.[markingId];
		if (!!marking) {
			const translated_name = getMarkingName(marking, languageCode);
			renderedMarkings.push(<View style={{
					borderRadius: 3,
					borderColor: textColor,
					borderWidth: 1,
					padding: 2,
				margin: 2
				}}>
				<Text>{translated_name}</Text>
			</View>
			)
		}
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

	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const lightContrastColor = useLighterOrDarkerColorForSelection(viewContrastColor);

	const foodAreaColor = useFoodsAreaColor();
	const foodAreaContrastColor = useMyContrastColor(foodAreaColor);

	const canteen_id = useCanteensIdFromGlobalSearchParams()
	const category = useFoodCategoryFromLocalSearchParams();
	const nextFoodIntervalInSeconds = useNextFoodIntervalInSecondsFromLocalSearchParams() || 10;
	const refreshFoodOffersIntervalInSeconds = useRefreshFoodOffersIntervalInSecondsFromLocalSearchParams() || 5 * 60;
	const canteen = useSynchedCanteenById(canteen_id);
	const [layout, setLayout] = useState({width: 0, height: 0});
	const [food_index, setFoodIndex] = useState(0);

	const translation_price_group_student = useTranslation(TranslationKeys.price_group_student)
	const translation_price_group_employee = useTranslation(TranslationKeys.price_group_employee)
	const translation_price_group_guest = useTranslation(TranslationKeys.price_group_guest)

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
					flex: designHeightLogo,
				}}>
					<View style={{flex: 1}} />
					<View style={{
						flex: 2,
						width: '100%',
						justifyContent: 'center',
						alignItems: 'center'
					}}>
						<CompanyLogo style={{
							height: '100%',
							width: '100%',
						}} />
					</View>
					<View style={{flex: 1}} />
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
							<MarkingNamesList markingIds={markingsIds} markingsDict={markingsDict} languageCode={languageCode} />
						</View>
					</View>
				</View>
				<View style={{
					height: 2,
					width: '100%',
				}}>
					<ProgressBar duration={nextFoodIntervalInSeconds} color={foodAreaColor} backgroundColor={foodAreaContrastColor} key={food_index+""}/>
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