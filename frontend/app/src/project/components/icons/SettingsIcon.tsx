import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";
import {TouchableOpacity} from "react-native";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {useAppTranslation} from "../translations/AppTranslation";
import {Tooltip} from "native-base";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";

export interface AppState{
	color?,
	accessibilityLabel?: string // the custom label
	accessibilityName?: string // alternative just the thing that next or previous
}
export const SettingsIcon: FunctionComponent<AppState> = (props) => {

	let iconName = "cog"

	return(
		<Icon name={iconName} color={props.color} accessibilityLabel={props?.accessibilityLabel} />
	)
}
