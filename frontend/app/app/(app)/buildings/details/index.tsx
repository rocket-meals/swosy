import {MySafeAreaViewThemed} from '@/components/MySafeAreaViewThemed';
import React from 'react';
import BuildingDetails from "@/compositions/buildings/BuildingDetails";
import {useBuildingIdFromLocalSearchParams} from "@/app/(app)/buildings";

export default function BuildingsDetails() {
	let buildings_id: string | undefined = useBuildingIdFromLocalSearchParams();

	return (
		<MySafeAreaViewThemed>
			<BuildingDetails buildingId={buildings_id}/>
		</MySafeAreaViewThemed>
	)
}