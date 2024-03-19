import {MySafeAreaView} from '@/components/MySafeAreaView';
import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import BuildingDetails from "@/compositions/buildings/BuildingDetails";

export default function BuildingsDetails() {
	const { building } = useLocalSearchParams<{ building: string }>();

	return (
		<MySafeAreaView>
			<BuildingDetails buildingId={building}/>
		</MySafeAreaView>
	)
}