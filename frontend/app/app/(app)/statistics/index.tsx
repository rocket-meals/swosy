import React, {useEffect, useState} from "react";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {TranslationKeys} from "@/helper/translations/Translation";
import {IconNames} from "@/constants/IconNames";
import {SettingsRowNavigateSimple} from "@/components/settings/SettingsRowNavigate";
import {
	View,
	Text,
	Heading,
	useViewBackgroundColor,
	getLineHeightInPixelBySize,
	HEADING_SIZE
} from "@/components/Themed";
import {DirectusFiles, Foods} from "@/helper/database/databaseTypes/types";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {FoodHelper} from "@/states/SynchedFoodOfferStates";
import {MyCardForResourcesWithImage} from "@/components/card/MyCardForResourcesWithImage";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {router} from "expo-router";
import {SEARCH_PARAM_FOODOFFER_ID} from "@/app/(app)/foodoffers/details";
import IndividualPricingBadge from "@/components/pricing/IndividualPricingBadge";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {MarkingBadges} from "@/components/food/MarkingBadge";
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {FoodNotifyButton} from "@/components/foodfeedback/FoodNotifyButton";
import {MyCardWithTextBottom, MyCardWithTextBottomWrapper} from "@/components/card/MyCardWithText";
import {FoodFeedbackRatingDetails} from "@/compositions/fooddetails/FoodDetails";
import {useLighterOrDarkerColorForSelection} from "@/helper/color/MyContrastColor";

export default function StatisticsScreen() {

	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const foods_placeholder_image = useFoodImagePlaceholderAssetId()
	const defaultViewBackgroundColor = useViewBackgroundColor()
	let lighterOrDarkerDefaultBackgroundColor = useLighterOrDarkerColorForSelection(defaultViewBackgroundColor)
	const lineHeightOfHeading = getLineHeightInPixelBySize(HEADING_SIZE);
	const foodTitleAmountLines = 2;
	const amountFoodsToLoad = 10;

	const foodsAreaColor = useFoodsAreaColor();

	const [mostLikedFoods, setMostLikedFoods] = useState<Foods[]>([]);
	const [mostDislikedFoods, setMostDislikedFoods] = useState<Foods[]>([]);

	async function loadMostLikedFoods(){
		let mostLiked = true;
		const mostLikedFoods = await FoodHelper.loadMostLikedOrDislikedFoods(amountFoodsToLoad, 0, undefined, mostLiked);
		setMostLikedFoods(mostLikedFoods);

		const mostDislikedFoods = await FoodHelper.loadMostLikedOrDislikedFoods(amountFoodsToLoad, 0, undefined, !mostLiked);
		setMostDislikedFoods(mostDislikedFoods);
	}

	async function loadFoods(){
		loadMostLikedFoods()
	}

	useEffect(() => {
		loadFoods()
	}, []);


	function renderFoodsList(sortedFoods: Foods[]){
		let rendered: any[] = [];
		for(let food of sortedFoods){
			let title = getFoodName(food, languageCode)
			const placeholderAssetId = foods_placeholder_image;
			let assetId: string | DirectusFiles | null | undefined = undefined
			let image_url: string | undefined = undefined
			let thumb_hash: string | undefined = undefined
			if (food?.image) {
				assetId = food.image
			}
			if (food?.image_remote_url) {
				image_url = food.image_remote_url
			}
			if (food?.image_thumb_hash) {
				thumb_hash = food.image_thumb_hash
			}

			const borderTopWidth = 1;
			const imageHeight = foodTitleAmountLines*lineHeightOfHeading+2*SETTINGS_ROW_DEFAULT_PADDING+borderTopWidth

			rendered.push(<View style={{
				width: "100%",
				paddingVertical: SETTINGS_ROW_DEFAULT_PADDING
			}}>
				<MyCardForResourcesWithImage
					key={food.id}
					imageHeight={imageHeight}
					componentRightToImage={
						<View style={{
							width: "100%",
							flex: 1,
							justifyContent: "flex-start",
							alignItems: "flex-start",
							borderTopWidth: 1,
							borderRightWidth: 1,
							borderTopRightRadius: MyCardDefaultBorderRadius,
							borderColor: lighterOrDarkerDefaultBackgroundColor
						}}>
							<View style={{
								margin: SETTINGS_ROW_DEFAULT_PADDING,
							}}>
								<Heading numberOfLines={foodTitleAmountLines}>{title}</Heading>
							</View>
						</View>
					}
					bottomComponent={<MyCardWithTextBottomWrapper noPadding={true} separatorColor={foodsAreaColor}>
						<FoodFeedbackRatingDetails food={food} />
					</MyCardWithTextBottomWrapper>}
					separatorColor={foodsAreaColor}
					thumbHash={thumb_hash}
					image_url={image_url}
					assetId={assetId}
					placeholderAssetId={placeholderAssetId}
					accessibilityLabel={title}
					innerPadding={0}
					imageUploaderConfig={{
						resourceId: food.id,
						resourceCollectionName: 'foods',
						onImageUpdated: () => {
							loadFoods();
						}
					}}
				/>
			</View>)
		}
		return rendered;
	}

	return (
		<MySafeAreaView>
				<View style={{
					width: "100%",
					flex: 1,
				}}>
					<View style={{
						flexDirection: "row",
						flex: 1,
					}}>
						<View style={{
							flex: 1,
							padding: SETTINGS_ROW_DEFAULT_PADDING,
							width: "100%"
						}}>
							<View style={{
								width: "100%",
							}}>
								<Heading>
									{"Top "+mostLikedFoods.length}
								</Heading>
							</View>
							<MyScrollView>
							{renderFoodsList(mostLikedFoods)}
							</MyScrollView>
						</View>
						<View style={{
							flex: 1,
							padding: SETTINGS_ROW_DEFAULT_PADDING,
							width: "100%"
						}}>
							<View style={{
								width: "100%",
							}}>
								<Heading>
									{"Worst "+mostDislikedFoods.length}
								</Heading>
							</View>
							<MyScrollView>
							{renderFoodsList(mostDislikedFoods)}
							</MyScrollView>
						</View>
					</View>
				</View>
		</MySafeAreaView>
	)
}