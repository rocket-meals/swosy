import React, {FunctionComponent} from "react";
import {CollectionImage} from "../../components/images/CollectionImage";
import {Image} from "react-native";
import {Buildings} from "../../directusTypes/types";
import {BuildingHelper} from "./BuildingHelper";

interface AppState {
	resource: Buildings
}
export const BuildingsImage: FunctionComponent<AppState> = (props) => {

	let customFallbackComponent = undefined
	const resource = props?.resource;
	const title = BuildingHelper.getName(resource);

	if(resource?.image_remote_url){
		let source={
			uri: resource?.image_remote_url,
		}
		customFallbackComponent = <Image source={source} alt={title || "Image"} style={{width: "100%", height: "100%"}}/>
	}

	return(
		<CollectionImage
			collection={"buildings"}
			item={props?.resource}
			itemImageField={"image"}
			placerholder_image_id={undefined}
			placeholder={undefined}
			onUpload={undefined}
			hideManipulation={undefined}
			alt={title}
			customFallbackComponent={customFallbackComponent}
		>
			{props?.children}
		</CollectionImage>
	)

}
