import React, {FunctionComponent, useEffect, useState} from "react";
import {DefaultComponentBorderColors} from "./DefaultComponentBorderColors";
import {ViewPercentageBorderradius} from "../../helper/ViewPercentageBorderradius";


interface AppState {
	hideBottomPartAndQuickRate?: boolean,
	borderRadius?: string | number,
	borderWidth?: number,
	borderColor?: string,
	like?: boolean,
	dislike?: boolean,
}
export const DetailsCardBorder: FunctionComponent<AppState> = (props) => {

	let overlayBorderWidth = 2;
	if(props?.borderWidth !== undefined && props?.borderWidth !== null){
		overlayBorderWidth = props?.borderWidth;
	}

	const borderOverlayStyle = {
		height: "100%",
		width: "100%",
		position: "absolute",
		borderRadius: props?.borderRadius,
		borderBottomLeftRadius: props?.borderRadius,
		borderBottomRightRadius: props?.borderRadius,
		pointerEvents: "box-none", //for web PointerEvents is a style not a prop
		borderWidth: overlayBorderWidth,
        borderColor: "transparent"
	}

	if(props?.hideBottomPartAndQuickRate){
		borderOverlayStyle.borderBottomLeftRadius = 0;
		borderOverlayStyle.borderBottomRightRadius = 0;
	}

	if(!!props?.borderColor){
		borderOverlayStyle.borderColor = props?.borderColor;
	}
	if(props?.like === true){
		borderOverlayStyle.borderColor = DefaultComponentBorderColors.like;
	}
	if(props?.dislike === true){
		borderOverlayStyle.borderColor = DefaultComponentBorderColors.dislike;
	}

	// in react-native PointerEvents is a prop not a style
	return(
		<ViewPercentageBorderradius style={borderOverlayStyle} pointerEvents="box-none" />
	)
}
