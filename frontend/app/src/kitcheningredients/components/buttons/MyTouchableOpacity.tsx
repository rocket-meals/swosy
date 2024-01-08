import React, {FunctionComponent} from "react";
import {Tooltip} from "native-base";
import {AccessibilityState, TouchableOpacity} from "react-native";

export interface AppState{
	disabled?: boolean,
	accessibilityLabel: string,
	accessibilityRole?: string,
	accessibilityState?: any
	style?: any
}
export const MyTouchableOpacity: FunctionComponent<AppState> = ({disabled, accessibilityState, accessibilityRole, accessibilityLabel, style ,...props}) => {

	let mergedStyle = []
	if(Array.isArray(style)){
		mergedStyle = style
	} else {
		mergedStyle.push(style)
	}
	if(disabled){
		mergedStyle.push({
			cursor: "not-allowed",
			opacity: 0.5
		});
	}

	const content = (
		<TouchableOpacity accessibilityState={accessibilityState} accessibilityRole={accessibilityRole ?? 'button'} accessibilityLabel={accessibilityLabel} disabled={disabled} style={mergedStyle} {...props}>
			{props?.children}
		</TouchableOpacity>
	)

	if(accessibilityLabel) {

		return (
			<Tooltip label={accessibilityLabel}>
				{content}
			</Tooltip>
		)
	} else {
		return content;
	}

}
