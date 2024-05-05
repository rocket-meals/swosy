import React, {useEffect} from 'react';
import {Text, View} from "@/components/Themed";
import {getMapMarkersFromBuildings, MyMap} from "@/compositions/map/MyMap";
import {useSynchedBuildingsDict} from "@/states/SynchedBuildings";
import {Buildings} from "@/helper/database/databaseTypes/types";
import {MyMapMarkerIcons} from "@/compositions/map/MyMapMarkerIcons";
import {Asset, useAssets} from "expo-asset";

import mapMarkerIcon from '@/assets/map/marker-icon-2x.png'
import * as FileSystem from "expo-file-system";
import {PlatformHelper} from "@/helper/PlatformHelper";
import type {PointTuple} from "leaflet";

export const MARKER_DEFAULT_SIZE = 48
export const getDefaultIconAnchor = (x: number, y: number): PointTuple => {
	return [6, y/2];
}

export default function MapScreen() {
	let markers = []

	const [assets, error] = useAssets([mapMarkerIcon]);
	const [imageAsString, setImageAsString] = React.useState<string | null>(null);

	const loadImageAsBase64 = async (fileUri: string) => {
		console.log("loadImageAsBase64: fileUri: ", fileUri)
		try {
			const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
			return `data:image/jpeg;base64,${base64}`;
		} catch (error) {
			console.error('Error loading image:', error);
			return null;
		}
	};

	async function loadImage(){
		const path = require(`@/assets/map/marker-icon-2x.png`);
		const htmlFile: Asset = await Asset.fromModule(path);
		if(PlatformHelper.isWeb()){
			/// for web everything is easy to handle with the uri
			setImageAsString(MyMapMarkerIcons.getIconForWebByUri(htmlFile.uri))
			return;
		} else {
			// on mobile the webview cannot access the uri, so we need to download the file and convert it to base64
			console.log("htmlFile: ", htmlFile)
			// format into base64
			await htmlFile.downloadAsync()
			const base64 = await loadImageAsBase64(htmlFile.localUri);
			console.log("base64: ", base64)
			if(base64) {
				//setImageAsString(htmlFile.localUri)
				setImageAsString(base64)
			}
			//setImageAsString(htmlFile.uri)
		}
	}

	const [buildingsDict, setBuildingsDict] = useSynchedBuildingsDict()
	if(buildingsDict && imageAsString){
		let buildingIds = Object.keys(buildingsDict);
		let buildings: Buildings[] = []
		for(let buildingId of buildingIds){
			let building = buildingsDict[buildingId]
			if(building){
				buildings.push(building)
			}
		}
		markers = getMapMarkersFromBuildings(buildings, imageAsString)
	}

	const POSITION_BUNDESTAG = { lat: 52.518594247456804, lng: 13.376281624711964 };

	if(markers.length === 0 && imageAsString){
		markers = [
			{
				id: "1",
				position: POSITION_BUNDESTAG,
				//icon: MyMapMarkerIcons.DEBUG_ICON,
				icon: imageAsString,
				size: [MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE],
				iconAnchor: getDefaultIconAnchor(MARKER_DEFAULT_SIZE, MARKER_DEFAULT_SIZE),
			},
		];
	}

	useEffect(() => {
		loadImage()
	}, [])

	if(!imageAsString){
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading...</Text>
			</View>
		)
	}


	return (
		<View style={{ flex: 1, width: "100%" }}>
			<MyMap markers={markers} />
		</View>
	);
}