import React, {FunctionComponent} from 'react';
import {Heading, Text, View} from '@/components/Themed';
import {useEditProfileCanteenAccessibilityLabel} from '@/compositions/settings/SettingsRowProfileCanteen';
import {useSynchedProfileCanteen} from '@/states/SynchedProfile';
import {useSynchedCanteenById, useSynchedCanteensDict} from '@/states/SynchedCanteens';
import {CanteenSelectGridList} from '@/compositions/resourceGridList/canteenSelectGridList';
import {AnimationNoFoodOffersFound} from "@/compositions/animations/AnimationNoFoodOffersFound";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export default function NoFoodOffersFound() {
	const translation_no_food_offers_found = useTranslation(TranslationKeys.no_foodoffers_found_for_selection);

	return (
		<View style={{width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 30}}>
			<Text>{translation_no_food_offers_found}</Text>
			<AnimationNoFoodOffersFound />
		</View>
	)
}