import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import FoodDetails from '@/compositions/fooddetails/FoodDetails';

export default function FoodOfferDetails() {
	const { foodoffer } = useLocalSearchParams<{ foodoffer: string }>();

	return (
		<MySafeAreaView>
			<FoodDetails foodOfferId={foodoffer}/>
		</MySafeAreaView>
	)
}