import {MySafeAreaView} from '@/components/MySafeAreaView';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import * as FileSystem from "expo-file-system";
import React from "react";
import {Asset, useAssets} from "expo-asset";
import {MyMapMarkerIcons} from "@/compositions/map/MyMapMarkerIcons";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {SettingsRowGroup} from "@/components/settings/SettingsRowGroup";
import {SettingsRow} from "@/components/settings/SettingsRow";
import {Text, View} from "@/components/Themed";

const path = require(`@/assets/map/marker-icon-2x.png`);

export default function AssetBase64() {

	const [counter, setCounter] = React.useState<number>(0);
	const [loadError, setLoadError] = React.useState<string | null>(null);
	const [imageAsString, setImageAsString] = React.useState<string | null>(null);

	const loadImageAsBase64 = async (fileUri: string) => {
		console.log("loadImageAsBase64: fileUri: ", fileUri)
		try {
			const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
			setImageAsString(base64);
			setLoadError(null);
		} catch (error: any) {
			console.error('Error loading image:', error);
			setLoadError("Error loading image: base64 is null, fileUri: " + error.message)
			setImageAsString(null);
		}
	};

	async function loadImage(){
		setCounter(counter+1);
		try{
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
				const base64 = await FileSystem.readAsStringAsync(htmlFile.localUri, { encoding: FileSystem.EncodingType.Base64 });
				console.log("base64: ", base64)
				if(base64) {
					//setImageAsString(htmlFile.localUri)
					setImageAsString(base64)
				}
				//setImageAsString(htmlFile.uri)
				setLoadError(null);
			}
		} catch (err){
			setLoadError(err.message);
			setImageAsString(null)
		}
	}

	return (
		<MySafeAreaView>
			<MyScrollView>
				<SettingsRowGroup>
					<SettingsRow labelLeft={"Counter: "+counter} />
					<SettingsRow labelLeft="Load Image" onPress={loadImage} />
					<SettingsRow labelLeft={"path: "+path} />
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRow labelLeft="Error" onPress={loadImage} />
					<Text>{JSON.stringify(loadError, null , 2)}</Text>
				</SettingsRowGroup>
				<SettingsRowGroup>
					<SettingsRow labelLeft="Image as string" onPress={loadImage} />
					<Text>{JSON.stringify(imageAsString, null , 2)}</Text>
				</SettingsRowGroup>

			</MyScrollView>
		</MySafeAreaView>
	);
}
