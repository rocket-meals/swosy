import React from 'react';
import {ActivityIndicator} from "react-native";
import {ExpoLeaflet, MapMarker} from "@/components/leaflet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {getMapLayers} from "@/compositions/map/LeafletMapLayers";
import {MyMapMarkerIcons} from "@/compositions/map/MyMapMarkerIcons";
import {Buildings} from "@/helper/database/databaseTypes/types";
import {getBuildingLocation} from "@/compositions/buildings/BuildingDetails";
import {Image} from "expo-image";
import {View} from "@/components/Themed";
import {useAssets} from "expo-asset";

const markerImage = require('@/assets/map/marker-icon-2x.png');
const source = markerImage;

// Dynamic import of ExpoLeaflet with SSR disabled

const POSITION_BUNDESTAG = { lat: 52.518594247456804, lng: 13.376281624711964 };
//https://www.openstreetmap.org/#map=19/52.518594247456804/13.376281624711964

export function getMapMarkersFromBuildings(buildings: Buildings[], iconUri: string): MapMarker[] {
	let markers: MapMarker[] = [];
	if(buildings){
		buildings.forEach((building) => {
			if(building){
				const location = getBuildingLocation(building);
				if (location) {
					markers.push({
						id: "building_"+building.id,
						position: {
							lat: location.latitude,
							lng: location.longitude
						},
						title: building.alias as string | undefined,
						icon: MyMapMarkerIcons.getIconWithUri(iconUri)
					});
				}
			}
		});
	}
	return markers;
}

export type MyMapProps = {
	markers: MapMarker[] | undefined
}

export const MyMap = ({markers}: MyMapProps) => {

	return (
		<MySafeAreaView>
			<View style={{
				flex: 1,
				width: "100%",
				height: "100%",
				justifyContent: "center",
				alignItems: "center",
			}}>
				<React.Suspense fallback={<ActivityIndicator size="large" color="#0000ff" />}>
					<ExpoLeaflet
						mapLayers={getMapLayers()}
						mapMarkers={markers}
						mapCenterPosition={POSITION_BUNDESTAG}
						maxZoom={18}
						zoom={15}
						loadingIndicator={() => <ActivityIndicator />}
						onMessage={(message) => {
							console.log(message);
						}}
					>
					</ExpoLeaflet>
				</React.Suspense>
			</View>
		</MySafeAreaView>
	);
};
