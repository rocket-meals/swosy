import React from 'react';
import { View } from "@/components/Themed";
import { ActivityIndicator } from "react-native";
import { ExpoLeaflet } from "expo-leaflet";

// Dynamic import of ExpoLeaflet with SSR disabled

// Map Layer configuration
const mapLayer = {
	baseLayerName: "OpenStreetMap",
	baseLayerIsChecked: true,
	layerType: "TileLayer",
	baseLayer: true,
	url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
	attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors",
};

export const MyMap = () => {
	const markers = [
		{
			id: "1",
			position: { lat: -25.34936, lng: -51.4788 },
			icon: "<div style='color:blue'>⚑</div>", // HTML-based icon for WebView rendering
			size: [24, 24],
		},
	];

	return (
		<View style={{ flex: 1, width: "100%" }}>
			<React.Suspense fallback={<ActivityIndicator size="large" color="#0000ff" />}>
				<ExpoLeaflet
					mapLayers={[mapLayer]}
					mapMarkers={markers}
					mapCenterPosition={{ lat: -25.35084, lng: -51.47921 }}
					maxZoom={20}
					zoom={15}
					loadingIndicator={() => <ActivityIndicator />}
					onMessage={(message) => {
						console.log(message);
					}}
				/>
			</React.Suspense>
		</View>
	);
};
