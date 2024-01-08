import React, {FunctionComponent, useState} from "react";
import {Text, Tooltip, View} from "native-base";
import {AccessibilityState, TouchableOpacity} from "react-native";

export interface AppState{
	disabled?: boolean,
	accessibilityLabel: string,
	accessibilityRole?: string,
	accessibilityHint?: string,
	accessibilityState?: any,
	style?: any
}
export const MyTouchableOpacity: FunctionComponent<AppState> = ({disabled, accessibilityRole, accessibilityLabel, style ,...props}) => {

	let mergedStyle = []
	if(Array.isArray(style)){
		mergedStyle = style
	} else {
		mergedStyle.push(style)
	}
	if(disabled){
		mergedStyle.push({
			cursor: "not-allowed",
			//opacity: 0.5
		});
	}

	return(
		<Tooltip label={accessibilityLabel} >
			<TouchableOpacity accessibilityState={props?.accessibilityState} accessibilityHint={props?.accessibilityHint} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} disabled={disabled} style={mergedStyle} {...props}>
				{props?.children}
			</TouchableOpacity>
		</Tooltip>
	)

}
