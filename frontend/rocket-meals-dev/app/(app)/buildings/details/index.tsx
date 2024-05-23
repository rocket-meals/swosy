import {MySafeAreaView} from '@/components/MySafeAreaView';
import React from 'react';
import BuildingDetails from "@/compositions/buildings/BuildingDetails";
import {useBuildingIdFromLocalSearchParams} from "@/app/(app)/buildings";

export default function BuildingsDetails() {
	let buildings_id: string | undefined = useBuildingIdFromLocalSearchParams();

	return (
		<MySafeAreaView>
			<BuildingDetails buildingId={buildings_id}/>
		</MySafeAreaView>
	)
}