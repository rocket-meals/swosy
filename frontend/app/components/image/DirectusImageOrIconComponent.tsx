import {Icon, View, Text, IconFamily, IconParseDirectusStringToIconAndFamily} from '@/components/Themed';
import React from 'react';
import DirectusImage from "@/components/project/DirectusImage";
import {StringHelper} from "@/helper/string/StringHelper";

export function hasResourceImageOrRemoteImage(resource: any){
	return resource.image || resource.image_remote_url;
}

export function hasResourceImageIconOrRemoteImage(resource: any){
	return hasResourceImageOrRemoteImage(resource) || resource.icon;
}

export default function DirectusImageOrIconComponent({ resource, iconFamily, widthImage, heightImage, iconColor }: { resource: any, iconFamily?: string, widthImage?: number, heightImage?: number, iconColor?: string }) {
	let iconLeft = resource.icon
	const alias = resource.alias
	let iconLeftCustom = undefined
	if(iconLeft){
		if(!iconFamily){ // a directus Icon
			let {
				family, icon
			} = IconParseDirectusStringToIconAndFamily(iconLeft)
			iconLeftCustom = <Icon accessibilityLabel={alias} name={icon} family={family} color={iconColor} />
		} else {
			iconLeftCustom = <Icon accessibilityLabel={alias}  name={iconLeft} color={iconColor} />
		}
	}
	if(hasResourceImageOrRemoteImage(resource)){
		let width = widthImage || 20;
		let height = heightImage || 20;

		iconLeftCustom = <View style={{
			width: width, height: height, justifyContent: 'center', alignItems: 'center', borderRadius: 3
		}}>
			<View style={{
				position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: height, width: width
			}}>
				<DirectusImage alt={alias} image_url={resource.image_remote_url} assetId={resource.image} thumbHash={resource.image_thumb_hash} style={{width: "100%", height: "100%"}} />
			</View>
		</View>
	}
	return iconLeftCustom
}