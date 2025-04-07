import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {
	getFoodOffersForSelectedDate,
	TABLE_NAME_FOODS,
	useFoodOfferSelectedDate
} from '@/states/SynchedFoodOfferStates';
import {DEFAULT_GRID_LIST_SPACING, MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {
	DirectusFiles,
	Foodoffers,
	FoodoffersCategories,
	Foods, FoodsCategories,
	FoodsFeedbacks,
	ProfilesMarkings
} from '@/helper/database/databaseTypes/types';
import {MyCardForResourcesWithImage} from '@/components/card/MyCardForResourcesWithImage';
import {useMyGridListDefaultColumns} from '@/components/grid/MyGridFlatListDefaultColumns';
import {
	CanteenSelectionRequired,
	useIsValidProfileCanteenSelected
} from '@/compositions/foodoffers/CanteenSelectionRequired';
import {useProfileLanguageCode, useSynchedProfileCanteen, useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import React, {useEffect, useState} from 'react';
import {MySpinner, View} from '@/components/Themed';
import {useIsDemo} from '@/states/SynchedDemo';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {router} from 'expo-router';
import IndividualPricingBadge from '@/components/pricing/IndividualPricingBadge';
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {SortType, useSynchedSortType} from "@/states/SynchedSortType";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {isRatingNegative, isRatingPositive} from "@/components/buttons/MyRatingButton";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {getFoodName} from "@/helper/food/FoodTranslation";
import {MarkingsDislikedWarningBadge} from "@/components/food/MarkingsDislikedWarningBadge";
import {useDislikeColor} from "@/states/ColorScheme";
import {useSynchedOwnFoodIdToFoodFeedbacksDict} from "@/states/SynchedFoodFeedbacks";
import {useFoodImagePlaceholderAssetId, useFoodsAreaColor, useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {MarkingBadges} from "@/components/food/MarkingBadge";
import NoFoodOffersFound from "@/compositions/foodoffers/NoFoodOffersFound";
import {ErrorGeneric} from "@/compositions/errors/ErrorGeneric";
import {SEARCH_PARAM_FOODOFFER_ID} from "@/app/(app)/foodoffers/details";
import {FoodNotifyButton} from "@/components/foodfeedback/FoodNotifyButton";
import {CanteenFeedbacksLabelsComponent} from "@/compositions/canteens/CanteenFeedbacks";
import {FoodOfferCategoriesHelper, useSynchedFoodoffersCategoriesDict} from "@/states/SynchedFoodoffersCategories";
import {FoodsCategoriesHelper, useSynchedFoodsCategoriesDict} from "@/states/SynchedFoodsCategories";
import {FoodAttributeBadges} from "@/components/food/FoodAttributeBadge";
import AppElement from "@/compositions/appElement/AppElement";
import {UrlHelper} from "@/helper/UrlHelper";
import {CommonSystemActionHelper} from "@/helper/device/CommonSystemActionHelper";


export function sortByFoodName(foodOffers: Foodoffers[], languageCode: string) {
	foodOffers.sort((a, b) => {
		let nameA = getFoodName(a.food, languageCode);
		let nameB = getFoodName(b.food, languageCode);
		if(nameA && nameB){
			return nameA.localeCompare(nameB);
		} else if (nameA){
			return -1;
		} else if (nameB){
			return 1;
		}
	});
	return foodOffers;
}

function sortByOwnFavorite(foodOffers: Foodoffers[], foodFeedbacksDict: Record<string, FoodsFeedbacks | undefined>) {
	foodOffers.sort((a, b) => {
		const aFoodId = a?.food?.id;
		const bFoodId = b?.food?.id;
		const aFeedback = foodFeedbacksDict[aFoodId];
		const bFeedback = foodFeedbacksDict[bFoodId];
		const aRating = aFeedback?.rating
		const bRating = bFeedback?.rating

		const aRatingPositive = isRatingPositive(aRating)
		const aRatingNegative = isRatingNegative(aRating);
		const aRatingUnknown = aRating === null || aRating === undefined;

		const bRatingPositive = isRatingPositive(bRating);
		const bRatingNegative = isRatingNegative(bRating);
		const bRatingUnknown = bRating === null || bRating === undefined;

		const returnAShouldBeFirst = -1;
		const returnNoOrder = 0;
		const returnBShouldBeFirst = 1;

		// negative ratings should be last, then unknown, then positive
		// complete cases aRatingNegative, aRatingUnknown, aRatingPositive and bRatingNegative, bRatingUnknown, bRatingPositive

		if(aRatingNegative && bRatingNegative){
			return returnNoOrder;
		} else if(aRatingNegative){
			return returnBShouldBeFirst;
		} else if(bRatingNegative){
			return returnAShouldBeFirst;
		}

		if(aRatingUnknown && bRatingUnknown){
			return returnNoOrder;
		} else if(aRatingUnknown){
			return returnBShouldBeFirst;
		} else if(bRatingUnknown){
			return returnAShouldBeFirst;
		}

		if(aRatingPositive && bRatingPositive){
			return returnNoOrder;
		} else if(aRatingPositive){
			return returnAShouldBeFirst;
		} else if(bRatingPositive){
			return returnBShouldBeFirst;
		}


	});
	return foodOffers;

}

function sortByPublicFavorite(foodOffers: Foodoffers[]) {
	foodOffers.sort((a, b) => {
		const aFood: Foods = a.food;
		const bFood: Foods = b.food;

		const aRating = aFood?.rating_average
		const bRating = bFood?.rating_average

		const aRatingPositive = isRatingPositive(aRating)
		const aRatingNegative = isRatingNegative(aRating);
		const aRatingUnknown = aRating === null || aRating === undefined;

		const bRatingPositive = isRatingPositive(bRating);
		const bRatingNegative = isRatingNegative(bRating);
		const bRatingUnknown = bRating === null || bRating === undefined;

		const returnAShouldBeFirst = -1;
		const returnNoOrder = 0;
		const returnBShouldBeFirst = 1;

		// negative ratings should be last, then unknown, then positive
		// complete cases aRatingNegative, aRatingUnknown, aRatingPositive and bRatingNegative, bRatingUnknown, bRatingPositive

		if (aRatingNegative && bRatingNegative) {
			return returnNoOrder;
		} else if (aRatingNegative) {
			return returnBShouldBeFirst;
		} else if (bRatingNegative) {
			return returnAShouldBeFirst;
		}

		if (aRatingUnknown && bRatingUnknown) {
			return returnNoOrder;
		} else if (aRatingUnknown) {
			return returnBShouldBeFirst;
		} else if (bRatingUnknown) {
			return returnAShouldBeFirst;
		}

		if (aRatingPositive && bRatingPositive) {
			return returnNoOrder;
		} else if (aRatingPositive) {
			return returnAShouldBeFirst;
		} else if (bRatingPositive) {
			return returnBShouldBeFirst;
		}
	});
	return foodOffers;
}

function sortByEatingHabits(foodOffers: Foodoffers[], profileMarkingsDict: Record<string, ProfilesMarkings>) {
	foodOffers.sort((a, b) => {
		//console.log(a.alias+ " vs "+b.alias);

		const aDislikedEatingHabitsFound = MarkingHelper.areDislikedEatingHabitsFoundInFoodOffer(a, profileMarkingsDict);
		const aAmountLikedEatingHabitsFound = MarkingHelper.getAmountLikedEatingHabitsFoundInFoodOffer(a, profileMarkingsDict);

		const bDislikedEatingHabitsFound = MarkingHelper.areDislikedEatingHabitsFoundInFoodOffer(b, profileMarkingsDict);
		const bAmountLikedEatingHabitsFound = MarkingHelper.getAmountLikedEatingHabitsFoundInFoodOffer(b, profileMarkingsDict);

		const returnAShouldBeFirst = -1;
		const returnNoOrder = 0;
		const returnBShouldBeFirst = 1;

		const likeSortWeight = 1;
		const dislikeSortWeight = likeSortWeight*2;

		let aSortValue = 0;

		// Allergene dislikes should be first and likes are not important for the order
		let dislikedEatingHabitsFoundInBoth = aDislikedEatingHabitsFound && bDislikedEatingHabitsFound;
		let dislikedEatingHabitsFoundInAtLeastOne = aDislikedEatingHabitsFound || bDislikedEatingHabitsFound;
		//console.log("-- dislikedEatingHabitsFoundInBoth: "+dislikedEatingHabitsFoundInBoth);
		//console.log("-- dislikedEatingHabitsFoundInAtLeastOne: "+dislikedEatingHabitsFoundInAtLeastOne);

		if(dislikedEatingHabitsFoundInAtLeastOne && !dislikedEatingHabitsFoundInBoth){
			if(aDislikedEatingHabitsFound){
				//console.log("-- aDislikedEatingHabitsFound");
				return returnBShouldBeFirst;
			} else {
				//console.log("-- bDislikedEatingHabitsFound");
				return returnAShouldBeFirst;
			}
		}

		// Allergenes are either in both or in none, so they are equal
		// we continue with the likes
		//console.log("-- aAmountLikedEatingHabitsFound: "+aAmountLikedEatingHabitsFound);
		//console.log("-- bAmountLikedEatingHabitsFound: "+bAmountLikedEatingHabitsFound);

		if(aAmountLikedEatingHabitsFound > bAmountLikedEatingHabitsFound){
			//console.log("-- aAmountLikedEatingHabitsFound > bAmountLikedEatingHabitsFound");
			return returnAShouldBeFirst;
		} else if(aAmountLikedEatingHabitsFound < bAmountLikedEatingHabitsFound){
			//console.log("-- aAmountLikedEatingHabitsFound < bAmountLikedEatingHabitsFound");
			return returnBShouldBeFirst;
		} else {
			//console.log("-- aAmountLikedEatingHabitsFound == bAmountLikedEatingHabitsFound");
			return returnNoOrder;
		}

	});
	return foodOffers;

}

export function useSortedFoodOffers(foodOffers: Foodoffers[] | undefined | null, sortTypeOrder: SortType[]) {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const [ownFoodFeedbacksDict, setOwnFoodFeedbacksDict, cacheHelperObjOwnFoodFeedbacks] = useSynchedOwnFoodIdToFoodFeedbacksDict();
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	console.log("useSortedFoodOffers");
	console.log("profilesMarkingsDict");
	console.log(JSON.parse(JSON.stringify(profilesMarkingsDict)))
	const [foodoffersCategoriesDict, setFoodoffersCategoriesDict] = useSynchedFoodoffersCategoriesDict()
	const [foodsCategoriesDict, setFoodsCategoriesDict] = useSynchedFoodsCategoriesDict()
	const foodFeedbacksDict = ownFoodFeedbacksDict;

	if(!foodOffers){
		return foodOffers;
	}

	let usedSortTypeOrder = sortTypeOrder;
	if(!usedSortTypeOrder || usedSortTypeOrder.length === 0 || usedSortTypeOrder.includes(SortType.intelligent)){
		usedSortTypeOrder = [SortType.alphabetical, SortType.foodoffersCategories, SortType.foodsCategories, SortType.favorite, SortType.eatingHabitsPreferences];
	}

	usedSortTypeOrder = [SortType.alphabetical, SortType.foodoffersCategories, SortType.foodsCategories, SortType.favorite, SortType.eatingHabitsPreferences];

	let copiedFoodOffers = [...foodOffers];
	for(const sortOrder of usedSortTypeOrder){
		copiedFoodOffers = sortFoodOffers(copiedFoodOffers, foodFeedbacksDict, profilesMarkingsDict, sortOrder, languageCode, foodoffersCategoriesDict, foodsCategoriesDict);
	}
	return copiedFoodOffers;
}

function sortFoodOffers(foodOffers: Foodoffers[], foodFeedbacksDict: Record<string, FoodsFeedbacks | undefined>, profileMarkingsDict: Record<string, ProfilesMarkings>, sortType: SortType, languageCode: string, foodoffersCategoriesDict: Record<string, FoodoffersCategories>, foodsCategoriesDict: Record<string, FoodsCategories>) {
	let copiedFoodOffers = [...foodOffers];
	if(sortType === SortType.alphabetical){
		copiedFoodOffers = sortByFoodName(copiedFoodOffers, languageCode);
	} else if(sortType === SortType.favorite){
		copiedFoodOffers = sortByOwnFavorite(copiedFoodOffers, foodFeedbacksDict);
	} else if(sortType === SortType.eatingHabitsPreferences){
		console.log("Sort by eating habits")
		console.log("Before");
		console.log(JSON.parse(JSON.stringify(copiedFoodOffers)));
		copiedFoodOffers = sortByEatingHabits(copiedFoodOffers, profileMarkingsDict);
		console.log("After");
		console.log(JSON.parse(JSON.stringify(copiedFoodOffers)));

	} else if(sortType === SortType.publicRating){
		copiedFoodOffers = sortByPublicFavorite(copiedFoodOffers);
	} else if(sortType === SortType.foodoffersCategories){
		copiedFoodOffers = FoodOfferCategoriesHelper.sortFoodoffersByFoodofferCategory(copiedFoodOffers, foodoffersCategoriesDict, languageCode);
	} else if(sortType === SortType.foodsCategories){
		copiedFoodOffers = FoodsCategoriesHelper.sortFoodoffersByFoodsCategory(copiedFoodOffers, foodsCategoriesDict, languageCode);
	}
	return copiedFoodOffers;
}

export default function FoodOfferScreen() {
	const isDemo = useIsDemo();
	const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [unsortedFoodoffers, setUnsortedFoodoffers] = useState<Foodoffers[] | undefined | null>(undefined);
	const isValidCanteenSelected = useIsValidProfileCanteenSelected();
	const dislikeColor = useDislikeColor();
	const [appSettings] = useSynchedAppSettings();
	const foods_placeholder_image = useFoodImagePlaceholderAssetId()

	const foodsAreaColor = useFoodsAreaColor();
	const foodoffers_list_before_element = appSettings?.foodoffers_list_before_element;
	const foodoffers_list_after_element = appSettings?.foodoffers_list_after_element;


	const dateAsIsoString = selectedDate.toISOString();

	const initialAmountColumns = useMyGridListDefaultColumns();

	const [sortType, setSortType] = useSynchedSortType(PersistentStore.sortConfigFoodoffers);
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();


	const foodOffersSorted = useSortedFoodOffers(unsortedFoodoffers, [sortType]);

	async function loadFoodOffers() {
		//console.log('loadFoodOffers')
		setUnsortedFoodoffers(undefined)
		if (isValidCanteenSelected && !!profileCanteen) {
			try{
				const downloadedFoodOffers = await getFoodOffersForSelectedDate(isDemo, selectedDate, profileCanteen);
				setUnsortedFoodoffers(downloadedFoodOffers);
				// sort the food offers
			} catch (err){
				console.error('loadFoodOffers error', err)
				setUnsortedFoodoffers(null);
			}
		} else {
			console.log('No valid canteen selected')
		}
	}

	// wait half a second before loading the food offers but reset the timeout if any dependencies change
	let depsReloadFood = [dateAsIsoString, profileCanteen?.id]
	useEffect(() => {
		setUnsortedFoodoffers(undefined)
		loadFoodOffers();
	}, depsReloadFood);

  type DataItem = { key: string; data: Foodoffers }

  const data: DataItem[] = []
  if (foodOffersSorted) {
  	for (let i = 0; i < foodOffersSorted.length; i++) {
  		const foodOffer = foodOffersSorted[i];
  		data.push({
  			key: foodOffer.id + '', data: foodOffer
  		})
  	}
  }

  const renderItem = (info: ListRenderItemInfo<DataItem>) => {
  	const {item, index} = info;
  	const foodOffer = item.data;
  	const food = foodOffer.food;
  	let title: string | null | undefined = foodOffer.id + ''
  	let assetId: string | DirectusFiles | null | undefined = undefined
  	let image_url: string | undefined = undefined
  	let thumb_hash: string | undefined = undefined

  	if (typeof food === 'object' && food !== null) {
  		if (food?.image) {
  			assetId = food.image
  		}
  		if (food?.image_remote_url) {
  			image_url = food.image_remote_url
  		}
  		if (food?.image_thumb_hash) {
  			thumb_hash = food.image_thumb_hash
  		}
		title = getFoodName(food, languageCode)

		const unwantedEatingHabitsFound = MarkingHelper.areDislikedEatingHabitsFoundInFoodOffer(foodOffer, profilesMarkingsDict);
		const borderColor = unwantedEatingHabitsFound ? dislikeColor : undefined;

		const markingBadge = unwantedEatingHabitsFound ? <MarkingsDislikedWarningBadge borderRadius={MyCardDefaultBorderRadius} foodoffer={foodOffer}/> : null;

		const placeholderAssetId = foods_placeholder_image;

		return (
			<MyCardForResourcesWithImage
				key={item.key}
				heading={title}
				borderColor={borderColor}
				separatorColor={foodsAreaColor}
				thumbHash={thumb_hash}
				image_url={image_url}
				assetId={assetId}
				placeholderAssetId={placeholderAssetId}
				onPress={() => {
					if(foodOffer.redirect_url){
						CommonSystemActionHelper.openExternalURL(foodOffer.redirect_url, true);
					} else {
						router.push(`/(app)/foodoffers/details/?${SEARCH_PARAM_FOODOFFER_ID}=${foodOffer.id}`)
					}
				}}
				accessibilityLabel={title}
				innerPadding={0}
				bottomRightComponent={
					<IndividualPricingBadge foodOffer={foodOffer} badgeProps={{
						color: foodsAreaColor
					}}/>
				}
				topLeftComponent={
							<ScrollViewWithGradient showsVerticalScrollIndicator={false} hideGradient={true} >
								<MarkingBadges foodoffer={foodOffer} />
								<FoodAttributeBadges foodoffer={foodOffer} />
							</ScrollViewWithGradient>
				}
				topRightComponent={
					<View style={{
						flexDirection: 'column',
					}}>
						<FoodFeedbackRating food={food} showQuickAction={true} borderRadius={MyCardDefaultBorderRadius} foodoffer={foodOffer} />
						{markingBadge}
						<FoodNotifyButton food={food} showOnlyWhenNotificationIsActive={true} foodoffer={foodOffer} />
					</View>
				}
				imageUploaderConfig={{
					resourceId: food.id,
					resourceCollectionName: TABLE_NAME_FOODS,
					onImageUpdated: () => {
						loadFoodOffers();
					}
				}}
			/>
		);
  	}

	  return null;
  }

  if (!isValidCanteenSelected) {
  	return (
  		<MySafeAreaView>
  			<CanteenSelectionRequired/>
  		</MySafeAreaView>
  	)
  } else {
  	if (foodOffersSorted === undefined) {
		// Show loading
		return <View style={{
			height: '100%',
			width: '100%',
			justifyContent: "center",
			alignItems: "center"
		}}>
			<MySpinner/>
		</View>
	} else if (foodOffersSorted === null) {
		return (
			<MySafeAreaView>
				<MyScrollView>
					<ErrorGeneric color={foodsAreaColor} />
				</MyScrollView>
			</MySafeAreaView>
		);
  	} else if (foodOffersSorted.length === 0) {
  		return (
  			<MySafeAreaView>
  				<MyScrollView>
					<NoFoodOffersFound />
  				</MyScrollView>
  			</MySafeAreaView>
  		);
  	} else if (foodOffersSorted.length > 0) {
  		return (
  			<MySafeAreaView>
  				<MyGridFlatList
  					data={data}
  					renderItem={renderItem}
  					amountColumns={initialAmountColumns}
					preItem={
					  	<>
							<View style={{
								width: '100%',
								paddingHorizontal: DEFAULT_GRID_LIST_SPACING.marginOuter
							}} >
								<AppElement id={foodoffers_list_before_element} color={foodsAreaColor} />
							</View>
						</>
					}
					postItem={
					  <>
						  <View style={{
							  width: '100%',
							  paddingHorizontal: DEFAULT_GRID_LIST_SPACING.marginOuter
						  }} >
							  <AppElement id={foodoffers_list_after_element} color={foodsAreaColor} />
						  </View>
						  <CanteenFeedbacksLabelsComponent canteen={profileCanteen} dateAsIsoString={dateAsIsoString} />
					  </>
					}
  				/>
  			</MySafeAreaView>
  		);
  	}
  }
}