import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import ApartmentDetails from "@/compositions/apartments/ApartmentDetails";

export default function ApartmentScreen() {
	const { apartment } = useLocalSearchParams<{ apartment: string }>();

	return (
		<MySafeAreaView>
			<ApartmentDetails apartmentId={apartment}/>
		</MySafeAreaView>
	)
}