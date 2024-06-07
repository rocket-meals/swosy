import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import ApartmentDetails from "@/compositions/apartments/ApartmentDetails";

export const SEARCH_PARAM_APARTMENTS_ID = 'apartments_id';

export function useApartmentsIdFromLocalSearchParams() {
	const params = useLocalSearchParams<{ [SEARCH_PARAM_APARTMENTS_ID]?: string }>();
	return params[SEARCH_PARAM_APARTMENTS_ID];
}

export default function ApartmentScreen() {
	const apartment_id = useApartmentsIdFromLocalSearchParams();

	return (
		<MySafeAreaView>
			<ApartmentDetails apartmentId={apartment_id}/>
		</MySafeAreaView>
	)
}