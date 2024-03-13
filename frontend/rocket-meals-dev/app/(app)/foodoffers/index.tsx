import {ListRenderItemInfo} from 'react-native';
import {MySafeAreaView} from '@/components/MySafeAreaView';
import {getFoodOffersForSelectedDate, useFoodOfferSelectedDate} from '@/states/SynchedFoodOfferStates';
import {MyGridFlatList} from '@/components/grid/MyGridFlatList';
import {DirectusFiles, Foodoffers} from '@/helper/database/databaseTypes/types';
import {MyCardForResourcesWithImage} from '@/components/card/MyCardForResourcesWithImage';
import {useMyGridListDefaultColumns} from '@/components/grid/MyGridFlatListDefaultColumns';
import {CanteenSelectionRequired, useIsValidCanteenSelected} from '@/compositions/foodoffers/CanteenSelectionRequired';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {useEffect, useState} from 'react';
import {Text, View} from '@/components/Themed';
import {useIsDemo} from '@/states/SynchedDemo';
import {AnimationNoFoodOffersFound} from '@/compositions/animations/AnimationNoFoodOffersFound';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {router} from 'expo-router';
import IndividualPricingBadge from '@/components/pricing/IndividualPricingBadge';

export default function FoodOfferScreen() {
	const isDemo = useIsDemo();
	const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
	const [profileCanteen, setProfileCanteen] = useSynchedProfileCanteen();
	const [foodOffers, setFoodOffers] = useState<Foodoffers[] | undefined>(undefined);
	const isValidCanteenSelected = useIsValidCanteenSelected();

	const translation_no_food_offers_found = useTranslation(TranslationKeys.no_foodoffers_found_for_selection);

	const dateAsString = selectedDate.toISOString();

	const initialAmountColumns = useMyGridListDefaultColumns();

	async function loadFoodOffers() {
		console.log('loadFoodOffers');
		if (isValidCanteenSelected && !!profileCanteen) {
			const downloadedFoodOffers = await getFoodOffersForSelectedDate(isDemo, selectedDate, profileCanteen);
			setFoodOffers(downloadedFoodOffers);
		} else {
			console.log('No valid canteen selected')
		}
	}


	useEffect(() => {
		loadFoodOffers()
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
  	if (typeof food !== 'string') {
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
  		/>
  	);
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