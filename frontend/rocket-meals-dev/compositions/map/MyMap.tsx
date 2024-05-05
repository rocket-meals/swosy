import React from 'react';
import {ActivityIndicator} from "react-native";
import {ExpoLeaflet, MapMarker} from "@/components/leaflet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {getMapLayers} from "@/compositions/map/LeafletMapLayers";
import {Buildings} from "@/helper/database/databaseTypes/types";
import {getBuildingLocation} from "@/compositions/buildings/BuildingDetails";
import {getDefaultIconAnchor, MARKER_DEFAULT_SIZE} from "@/app/(app)/map";

const markerImage = require('@/assets/map/marker-icon-2x.png');
const source = markerImage;

// Dynamic import of ExpoLeaflet with SSR disabled

const POSITION_BUNDESTAG = { lat: 52.518594247456804, lng: 13.376281624711964 };
//https://www.openstreetmap.org/#map=19/52.518594247456804/13.376281624711964

export function getMapMarkersFromBuildings(buildings: Buildings[], icon: string): MapMarker[] {
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
						icon: icon,
						size: [MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE],
						iconAnchor: getDefaultIconAnchor(MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE),
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
						if(message.tag === "onMapMarkerClicked"){
							console.log("Marker clicked: "+message.mapMarkerId)
						}
					}}
				>
				</ExpoLeaflet>
			</React.Suspense>
		</MySafeAreaView>
	);
};
