import React, {FunctionComponent} from "react";
import {Icon} from "../../../kitcheningredients";
import {TouchableOpacity} from "react-native";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {useAppTranslation} from "../translations/AppTranslation";
import {Tooltip} from "native-base";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {MyTouchableOpacity} from "../buttons/MyTouchableOpacity";

export interface AppState{
	onPress?,
	color?,
	forward: boolean
	accessibilityLabel?: string // the custom label
	accessibilityName?: string // alternative just the thing that next or previous
}
export const SwitchIcon: FunctionComponent<AppState> = (props) => {

	let forward = props?.forward;
	let iconName = forward ? "chevron-right" : "chevron-left"

	const accessibilityLabelNext = useAppTranslation("accessibility_next")
	const accessibilityLabelPrevious = useAppTranslation("accessibility_previous")
	const accessibilityName = props?.accessibilityName;
	let accessibilityLabel = props?.accessibilityLabel;
	if(!accessibilityLabel){
		accessibilityLabel = forward ? accessibilityLabelNext : accessibilityLabelPrevious;
		if(accessibilityName){
			accessibilityLabel = accessibilityName + ": " + accessibilityLabel;
		}
	}

	let padding = 80;
	let style = forward ? {paddingLeft: padding} : {paddingRight: padding};

	return(
			<ViewPixelRatio style={style}>
					<MyTouchableOpacity accessibilityLabel={accessibilityLabel} style={ImageOverlayPaddingStyle} onPress={() => {
						if(props?.onPress){
							props?.onPress(forward);
						}
					}}>
						<Icon name={iconName} color={props?.color} accessibilityLabel={accessibilityLabel} />
					</MyTouchableOpacity>
			</ViewPixelRatio>
	)
}
