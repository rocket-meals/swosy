import {MySafeAreaView} from '@/components/MySafeAreaView';
import React from 'react';
import {MarkingList} from "@/components/food/MarkingList";
import {AnimationAllergene} from "@/compositions/animations/AnimationAllergene";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {View, Text} from "@/components/Themed";
import {FoodInformationDisclaimer} from "@/compositions/fooddetails/FoodDetails";

export default function EatingHabitsScreen() {

	const translation_eatinghabits_introduction = useTranslation(TranslationKeys.eatinghabits_introduction)

	const preItem = <>
		<AnimationAllergene />
		<View style={{
			width: '100%',
			paddingHorizontal: 20,
		}}>
			<Text>{translation_eatinghabits_introduction}</Text>
			<FoodInformationDisclaimer />
		</View>
	</>

	return (
		<MySafeAreaView>
			<MarkingList preItem={preItem} />
		</MySafeAreaView>
	)
}
