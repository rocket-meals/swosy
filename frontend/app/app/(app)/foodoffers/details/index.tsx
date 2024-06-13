import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useGlobalSearchParams, useLocalSearchParams} from 'expo-router';
import React from 'react';
import FoodDetails from '@/compositions/fooddetails/FoodDetails';

export const SEARCH_PARAM_FOODOFFER_ID = 'foodoffers_id';

export function useFoodoffersIdFromLocalSearchParams() {
	const params = useGlobalSearchParams<{ [SEARCH_PARAM_FOODOFFER_ID]?: string }>();
	return params[SEARCH_PARAM_FOODOFFER_ID];
}

export default function FoodOfferDetails() {
	const foodoffer = useFoodoffersIdFromLocalSearchParams();

	return (
		<MySafeAreaView>
			<FoodDetails foodOfferId={foodoffer}/>
		</MySafeAreaView>
	)
}