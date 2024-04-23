import {Icon, View, Text} from '@/components/Themed';
import React from 'react';
import DirectusImage from "@/components/project/DirectusImage";
import {StringHelper} from "@/helper/string/StringHelper";

export default function DirectusSmallImageOrIconComponent({ resource }: { resource: any }) {
	let iconLeft = resource.icon
	let iconLeftCustom = undefined
	if(iconLeft){
		iconLeft = StringHelper.replaceAll(iconLeft, "_", "-") // directus uses _ instead of - for icon names
		iconLeftCustom = <Icon family={"MaterialIcons"} name={iconLeft} />
	}
	if(resource.image || resource.image_remote_url){
		iconLeftCustom = <View style={{
			width: 20, height: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 3
		}}>
			<DirectusImage image_url={resource.image_remote_url} assetId={resource.image} thumbHash={resource.image_thumb_hash} style={{width: "100%", height: "100%"}} />
		</View>
	}
	return iconLeftCustom
}