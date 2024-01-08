import React, {FunctionComponent, useEffect, useState} from "react";
import {CollectionImage} from "../images/CollectionImage";
import {Text, View} from "native-base";
import {useSynchedSettingsFoods} from "../../helper/synchedJSONState";
import {Image, Platform} from "react-native";
import {AccessibilityRoles} from "../../../kitcheningredients/helper/AccessibilityRoles";

export type FoodImageProps = {
	food: any;
	placeholder: any;
	onUpload?: any;
	children?: any;
	hideManipulation?: boolean;
	alt: string;
}
export const FoodImage: FunctionComponent<FoodImageProps> = (props) => {

	const [foodSettings, setFoodSettings] = useSynchedSettingsFoods();

	let placeholder_image_id = foodSettings?.placeholder_image || -1;

	useEffect(() => {

	}, [props]);

	let customFallbackComponent = undefined;

	let showImagesFromCustomBackend = true;

	if(showImagesFromCustomBackend){
		let foodId = props?.food?.id || -1;
		let quality = "medium"; // "thumbnail", "medium", "high", "small", "original"
		let uri = "https://app.stwh.customer.ingenit.com/api/meals/"+foodId+"/photos?resTag=medium&webp=false";

		let source={
			uri: uri,
		}

		customFallbackComponent = (
			<View accessibilityLabel={props?.alt || "Image"} style={{ width: '100%', height: '100%' }}>
				<Image accessibilityRole={AccessibilityRoles.image} accessibilityLabel={props?.alt || "Image"} source={source} alt={props?.alt || "Image"} style={{ width: '100%', height: '100%' }}/>
			</View>
		);
		/**
		if(Platform.OS==="web"){
			customFallbackComponent = (
				<img src={uri} alt={props?.alt || "Image"} style={{
					height: "100%",
					width: "100%",
					objectFit: 'cover', // or 'cover', 'fill', etc.
					}}/>
			);
		}
		 */
	}

	return (
		<CollectionImage
			collection={"foods"}
			item={props?.food}
			itemImageField={"image"}
			placerholder_image_id={placeholder_image_id}
			placeholder={props?.placeholder}
			customFallbackComponent={customFallbackComponent}
			onUpload={props?.onUpload}
			hideManipulation={props?.hideManipulation}
			alt={props?.alt}
		>
			{props?.children}
		</CollectionImage>
	)

}
