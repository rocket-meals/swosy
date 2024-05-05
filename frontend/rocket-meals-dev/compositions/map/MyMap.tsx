import React from 'react';
import { View } from "@/components/Themed";
import { ActivityIndicator } from "react-native";
import {ExpoLeaflet} from "@/components/leaflet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {getMapLayers, LeafletMapLayers} from "@/compositions/map/LeafletMapLayers";

// Dynamic import of ExpoLeaflet with SSR disabled

export const MyMap = () => {
	const markers = [
		{
			id: "1",
			position: { lat: 52.520008, lng:  13.404954 },
			icon: "<div style='color:blue'>⚑</div>", // HTML-based icon for WebView rendering
			size: [24, 24],
		},
	];

	return (
		<MySafeAreaView>
			<React.Suspense fallback={<ActivityIndicator size="large" color="#0000ff" />}>
				<ExpoLeaflet
					mapLayers={getMapLayers()}
					mapMarkers={markers}
					mapCenterPosition={{ lat: 52.520008, lng:  13.404954 }}
					maxZoom={18}
					zoom={15}
					loadingIndicator={() => <ActivityIndicator />}
					onMessage={(message) => {
						console.log(message);
					}}
				/>
			</React.Suspense>
		</MySafeAreaView>
	);
};
