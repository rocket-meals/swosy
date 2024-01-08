import React, {FunctionComponent, useState} from "react";

import {useAppTranslation} from "../translations/AppTranslation";
import {MyTouchableOpacity} from "./MyTouchableOpacity";

export interface AppState{
	disabled?: boolean,
	accessibilityLabel: string,
	accessibilityRole?: string,
	style?: any
}
export const MyTouchableOpacityForNavigation: FunctionComponent<AppState> = ({disabled, accessibilityRole, accessibilityLabel, style ,...props}) => {

	const translationNavigateTo = useAppTranslation("navigateTo")
	const accessibilityLabelWithNavigation = translationNavigateTo+": "+accessibilityLabel;

	return(
		<MyTouchableOpacity accessibilityRole={"link"} accessibilityLabel={accessibilityLabelWithNavigation} disabled={disabled} style={style} {...props}>
			{props?.children}
		</MyTouchableOpacity>
	)

}
