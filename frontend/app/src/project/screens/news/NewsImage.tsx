import React, {FunctionComponent} from "react";
import {News} from "../../directusTypes/types";
import {CollectionImage} from "../../components/images/CollectionImage";
import {Image} from "react-native";
import {useDirectusTranslation} from "../../components/translations/DirectusTranslationUseFunction";

interface AppState {
	resource: News
}
export const NewsImage: FunctionComponent<AppState> = (props) => {

	const resource = props?.resource;

	const translations = resource?.translations;
	const title = useDirectusTranslation(translations, "title");

	let customFallbackComponent = undefined
	if(resource?.image_remote_url){
		let source={
			uri: resource?.image_remote_url,
		}
		customFallbackComponent = <Image source={source} alt={"Image: "+title} style={{width: "100%", height: "100%"}}/>
	}


	return(
		<CollectionImage
			collection={"news"}
			item={props?.resource}
			itemImageField={"image"}
			placerholder_image_id={undefined}
			placeholder={undefined}
			onUpload={undefined}
			hideManipulation={undefined}
			alt={"Image: "+title}
			customFallbackComponent={customFallbackComponent}
		>
			{props?.children}
		</CollectionImage>
	)

}
