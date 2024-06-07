import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import FoodDetails from '@/compositions/fooddetails/FoodDetails';

export const SEARCH_PARAM_FOODOFFER_ID = 'foodoffers_id';

export function useFoodoffersIdFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_FOODOFFER_ID]?: string }>();
	return params[SEARCH_PARAM_FOODOFFER_ID];
}

export default function FoodOfferDetails() {
	const foodoffer = useFoodoffersIdFromLocalSearchParams();

	return (
		<MySafeAreaViewThemed>
			<FoodDetails foodOfferId={foodoffer}/>
		</MySafeAreaViewThemed>
	)
}