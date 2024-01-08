import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {useSynchedImageOverlays, useSynchedImageOverlaysDict} from "../../helper/synchedJSONState";
import {IMAGE_OVERLAY_CUSTOM_POSITION_FIELD, IMAGE_OVERLAY_ID_FIELD} from "./ImageOverlay";

export enum ImageOverlayPosition {
	TOP_LEFT = "top_left",
	TOP_RIGHT = "top_right",
	BOTTOM_LEFT = "bottom_left",
	BOTTOM_RIGHT = "bottom_right",
}
interface AppState {
	width?: number,
}
export const ImageOverlays: FunctionComponent<AppState> = (props) => {

	const width = props?.width;
	const [imageOverlays, setImageOverlays] = useSynchedImageOverlaysDict();

	const renderedChildren = [];

	const topLeftRenderedChildren = [];
	const topRightRenderedChildren = [];
	const bottomLeftRenderedChildren = [];
	const bottomRightRenderedChildren = [];

	//https://stackoverflow.com/questions/29670173/accessing-react-component-children-props-from-the-parent
	const children = props?.children || [];

	React.Children.forEach(children, element => {
		if (!React.isValidElement(element)) return

		const childProps = element.props;

		const idField = IMAGE_OVERLAY_ID_FIELD
		const imageOverlayId = childProps?.[idField];

		const customPosition = childProps?.[IMAGE_OVERLAY_CUSTOM_POSITION_FIELD];
		let position = customPosition;

		if(!!imageOverlayId){
			const imageOverlay = imageOverlays[imageOverlayId];
			position = imageOverlay?.position;
		}

		if(!!position){
			const topleft = position === ImageOverlayPosition.TOP_LEFT;
			const topright = position === ImageOverlayPosition.TOP_RIGHT;
			const bottomleft = position === ImageOverlayPosition.BOTTOM_LEFT;
			const bottomright = position === ImageOverlayPosition.BOTTOM_RIGHT;

			//add the prop width to the child with the original childprops
			const childWithWidth = React.cloneElement(element, {
				//@ts-ignore
				...childProps,
				width: width,
			});

			if(topleft){
				topLeftRenderedChildren.push(childWithWidth);
			} else if(topright){
				topRightRenderedChildren.push(childWithWidth);
			} else if(bottomleft){
				bottomLeftRenderedChildren.push(childWithWidth);
			} else if(bottomright){
				bottomRightRenderedChildren.push(childWithWidth);
			} else {
				bottomRightRenderedChildren.push(childWithWidth);
			}
		} else {
			renderedChildren.push(element);
		}

		//do something with source..
	})

	renderedChildren.push(
		<View key="topLeft" style={{position: "absolute", top: 0, left: 0}}>
			{topLeftRenderedChildren}
		</View>
	)
	renderedChildren.push(
		<View key="topRight" style={{position: "absolute", top: 0, right: 0}}>
			{topRightRenderedChildren}
		</View>
	)
	renderedChildren.push(
		<View key="bottomLeft" style={{position: "absolute", bottom: 0, left: 0}}>
			{bottomLeftRenderedChildren}
		</View>
	)
	renderedChildren.push(
		<View key="bottomRight" style={{position: "absolute", bottom: 0, right: 0}}>
			{bottomRightRenderedChildren}
		</View>
	)

	return renderedChildren


}
