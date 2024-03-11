import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import FoodDetails from '@/compositions/fooddetails/FoodDetails';

export default function FoodOfferDetails() {
	const { food } = useLocalSearchParams<{ food: string }>();

	return (
		<MySafeAreaView>
			<FoodDetails foodOfferId={food}/>
		</MySafeAreaView>
	)
}