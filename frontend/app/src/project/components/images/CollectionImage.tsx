import React, {FunctionComponent, useEffect, useState} from "react";
import {Image, Input, Text, View} from "native-base";
import {ConfigHolder, CrossLottie, Icon, KitchenSkeleton} from "../../../kitcheningredients";
import {DirectusImage} from "../../../kitcheningredients";
import {PermissionHelper} from "../../helper/PermissionHelper";
import {useDemoMode, useSynchedRemoteSettings} from "../../helper/synchedJSONState";
import {CollectionImageManipulator} from "./CollectionImageManipulator";
import {CollectionImageDev} from "./CollectionImageDev";

interface AppState {
	placerholder_image_id: string;
	customFallbackComponent?: any;
}

export const CollectionImage: FunctionComponent<AppState> = ({alt, hideManipulation, collection, item, itemImageField, placerholder_image_id, customFallbackComponent, placeholder, onUpload, children,...props}) => {

	const [demo, setDemo] = useDemoMode()
	const [remoteAppSettings, setRemoteAppSettings] = useSynchedRemoteSettings();
	let appSettingsPlaceholder_image = placerholder_image_id || -1; //-1 will trigger static fallback

	// corresponding componentDidMount
	useEffect(() => {

	}, [props])

	if(demo){
		let devImage = CollectionImageDev.renderLocalImage(collection, item, children);
		if(devImage){
			return devImage;
		}
	}



	let assetId = item?.[itemImageField] || -1; //-1 will trigger static fallback

	let uploadPermission = PermissionHelper.canUpdate(collection, itemImageField);

	let staticFallbackElement = (
		<View style={{width: "100%", height: "100%", alignItems: "center", justifyContent: "center"}}>
			<Icon name={"image-off"}/>
			<Text>{alt || "No image"}</Text>
		</View>
	);

	let fallbackElement = <DirectusImage alt={"No Image"} assetId={appSettingsPlaceholder_image} style={{ width: '100%', height: '100%' }} fallbackElement={staticFallbackElement} />
	if(customFallbackComponent){
		fallbackElement = customFallbackComponent;
	}

	let uploadElement = null;
	 if(uploadPermission && !hideManipulation){
		//fallbackElement = null;
		uploadElement = <View style={{justifyContent: "center", alignItems: "center" , width: "80%", height: "60%", position: "absolute", right: "10%", top: "40%"}}>
			<CollectionImageManipulator collection={collection} item={item} itemImageField={itemImageField} onUpload={onUpload} />
		</View>
	}

	let image = <DirectusImage alt={alt} assetId={assetId} style={{ width: '100%', height: '100%' }} fallbackElement={fallbackElement} >{uploadElement}</DirectusImage>;

	if(placeholder){
		image = <KitchenSkeleton flex={1} />
	}

	return(
		<View style={{ width: '100%', height: '100%' }}>
			{image}
			{uploadElement}
			{children}
		</View>
	)
}
