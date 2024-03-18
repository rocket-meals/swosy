import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {getFoodOffersForSelectedDate, useFoodOfferSelectedDate} from '@/states/SynchedFoodOfferStates';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {DirectusFiles, Foodoffers} from '@/helper/database/databaseTypes/types';
import {MyCardForResourcesWithImage} from '@/components/card/MyCardForResourcesWithImage';
import {useMyGridListDefaultColumns} from '@/components/grid/MyGridFlatListDefaultColumns';
import {CanteenSelectionRequired, useIsValidCanteenSelected} from '@/compositions/foodoffers/CanteenSelectionRequired';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import React, {useEffect, useState} from 'react';
import {Spinner, Text, View} from '@/components/Themed';
import {useIsDemo} from '@/states/SynchedDemo';
import {AnimationNoFoodOffersFound} from '@/compositions/animations/AnimationNoFoodOffersFound';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {Link, router, useNavigation} from 'expo-router';
import IndividualPricingBadge from '@/components/pricing/IndividualPricingBadge';
import {FoodFeedbackRating} from "@/components/foodfeedback/FoodRatingDisplay";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {useServerInfo} from "@/states/SyncStateServerInfo";
import {AnimationThinking} from "@/compositions/animations/AnimationThinking";
import {useProjectName} from "@/states/ProjectInfo";

export default function FoodOfferScreen() {
	const isDemo = useIsDemo();
	const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [foodOffers, setFoodOffers] = useState<Foodoffers[] | undefined | null>(undefined);
	const isValidCanteenSelected = useIsValidCanteenSelected();
	const projectName = useProjectName()

	const translation_no_food_offers_found = useTranslation(TranslationKeys.no_foodoffers_found_for_selection);
	const translation_error = useTranslation(TranslationKeys.error);

	const navigation = useNavigation();

	const dateAsString = selectedDate.toISOString();

	const initialAmountColumns = useMyGridListDefaultColumns();

	async function loadFoodOffers() {
		console.log('loadFoodOffers');
		setFoodOffers(undefined)
		if (isValidCanteenSelected && !!profileCanteen) {
			try{
				const downloadedFoodOffers = await getFoodOffersForSelectedDate(isDemo, selectedDate, profileCanteen);
				setFoodOffers(downloadedFoodOffers);
			} catch (err){
				setFoodOffers(null);
			}
		} else {
			console.log('No valid canteen selected')
		}
	}


	useEffect(() => {
		// wait half a second before loading the food offers
		// to prevent the screen from flickering
		setFoodOffers(undefined)
		const timeout = setTimeout(async () => {
			await loadFoodOffers();
		}, 500);
	}, [dateAsString, profileCanteen?.id]);

  type DataItem = { key: string; data: Foodoffers }

  const data: DataItem[] = []
  if (foodOffers) {
  	for (let i = 0; i < foodOffers.length; i++) {
  		const foodOffer = foodOffers[i];
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
  		if (food?.alias) {
  			title = food.alias
  		}
  		if (foodOffer?.alias) {
  			title = foodOffer.alias
  		}

	    //TODO: This is a temporary "fix" for the SWOSY project
		if (projectName === "SWOSY") {
			//replace the url with the server url
			image_url = "https://swosy.sw-os.de:3001/api/meals/"+ food.id + "/photos";
		}

		return (
			<MyCardForResourcesWithImage
				key={item.key}
				heading={title}
				thumbHash={thumb_hash}
				image_url={image_url}
				assetId={assetId}
				onPress={() => {
					router.push(`/(app)/foods/${foodOffer.id}`)
				}}
				accessibilityLabel={title}
				innerPadding={0}
				bottomRightComponent={
					<IndividualPricingBadge foodOffer={foodOffer}/>
				}
				topRightComponent={
					<FoodFeedbackRating food={food} showOnlyMax={true} borderRadius={MyCardDefaultBorderRadius}/>
				}
				imageUploaderConfig={{
					resourceId: food.id,
					resourceCollectionName: 'foods',
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
  	if (foodOffers === undefined) {
		// Show loading
		return <View style={{
			height: '100%',
			width: '100%',
			justifyContent: "center",
			alignItems: "center"
		}}>
			<Spinner/>
		</View>
	} else if (foodOffers === null) {
		return (
			<MySafeAreaView>
				<MyScrollView>
					<View style={{width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 30}}>
						<Text>{translation_error}</Text>
						<AnimationThinking />
					</View>
				</MyScrollView>
			</MySafeAreaView>
		);
  	} else if (foodOffers.length === 0) {
  		return (
  			<MySafeAreaView>
  				<MyScrollView>
  					<View style={{width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 30}}>
  						<Text>{translation_no_food_offers_found}</Text>
  						<AnimationNoFoodOffersFound />
  					</View>
  				</MyScrollView>
  			</MySafeAreaView>
  		);
  	} else if (foodOffers.length > 0) {
  		return (
  			<MySafeAreaView>
  				<MyGridFlatList
  					data={data}
  					renderItem={renderItem}
  					amountColumns={initialAmountColumns}
  				/>
  			</MySafeAreaView>
  		);
  	}
  }
}