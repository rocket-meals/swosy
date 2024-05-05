import React from 'react';
import {View} from "@/components/Themed";
import {getMapMarkersFromBuildings, MyMap} from "@/compositions/map/MyMap";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {Buildings} from "@/helper/database/databaseTypes/types";
import {MyMapMarkerIcons} from "@/compositions/map/MyMapMarkerIcons";
import {useAssets} from "expo-asset";

import mapMarkerIcon from '@/assets/map/marker-icon-2x.png'

export default function MapScreen() {
	let markers = []


	const [assets, error] = useAssets([mapMarkerIcon]);

	console.log(assets)

	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	if(buildingsDict && assets && assets.length > 0){
		let buildingIds = Object.keys(buildingsDict);
		let buildings: Buildings[] = []
		for(let buildingId of buildingIds){
			let building = buildingsDict[buildingId]
			if(building){
				buildings.push(building)
			}
		}
		markers = getMapMarkersFromBuildings(buildings, assets[0].uri)
	}

	if(markers.length === 0){
		const POSITION_BUNDESTAG = { lat: 52.518594247456804, lng: 13.376281624711964 };
		markers = [
			{
				id: "1",
				position: POSITION_BUNDESTAG,
				//icon: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png"
				//icon: "<div style='color:blue'>⚑</div>", // HTML-based icon for WebView rendering
				icon: MyMapMarkerIcons.DEBUG_ICON
				//size: [24, 24],
			},
		];
	}


	return (
		<View style={{ flex: 1, width: "100%" }}>
			<MyMap markers={markers} />
		</View>
	);
}