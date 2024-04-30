import {Icon, View, Text} from '@/components/Themed';
import React from 'react';
import DirectusImage from "@/components/project/DirectusImage";
import {StringHelper} from "@/helper/string/StringHelper";

export function hasResourceImageOrRemoteImage(resource: any){
	return resource.image || resource.image_remote_url;
}

export default function DirectusImageOrIconComponent({ resource, widthImage, heightImage }: { resource: any, widthImage?: number, heightImage?: number }) {
	let iconLeft = resource.icon
	let iconLeftCustom = undefined
	if(iconLeft){
		if(iconLeft.includes("_")){ // a directus Icon
			iconLeft = StringHelper.replaceAll(iconLeft, "_", "-") // directus uses _ instead of - for icon names
			iconLeftCustom = <Icon family={"MaterialIcons"} name={iconLeft} />
		} else {
			iconLeftCustom = <Icon name={iconLeft} />
		}
	}
	if(hasResourceImageOrRemoteImage(resource)){
		let width = widthImage || 20;
		let height = heightImage || 20;

		iconLeftCustom = <View style={{
			width: width, height: height, justifyContent: 'center', alignItems: 'center', borderRadius: 3
		}}>
			<DirectusImage image_url={resource.image_remote_url} assetId={resource.image} thumbHash={resource.image_thumb_hash} style={{width: "100%", height: "100%"}} />
		</View>
	}
	return iconLeftCustom
}