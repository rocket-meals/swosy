import React from "react";
import {Image, View} from "native-base";

export class CollectionImageDev {

	static renderRemoteImage(imageURL, children){
		return CollectionImageDev.renderImage({uri: imageURL}, children);
	}

	static renderImage(source, children){
		return(
			<View style={{ width: '100%', height: '100%' }}>
				<Image source={source} alt={""} style={{ width: '100%', height: '100%' }}
				/>
				{children}
			</View>
		)
	}

	static getImageFromListById(itemId: number, list: any[]){
		return list[itemId%list.length];
	}

	static renderLocalImage(collection, item, children){
		let imageURL = null;

		let itemId = item?.id;

		if(imageURL){
			return CollectionImageDev.renderRemoteImage(imageURL, children);
		} else {
			return null;
		}
	}

}
