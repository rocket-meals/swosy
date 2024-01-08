import React, {FunctionComponent} from "react";
import {ViewPixelRatio} from "../../helper/ViewPixelRatio";
import {StringHelper} from "../../helper/StringHelper";
import {TouchableOpacity} from "react-native";
import {InfoIcon} from "../icons/InfoIcon";
import {Navigation, useMyContrastColor} from "../../../kitcheningredients";
import {CanteenContent} from "../../screens/canteen/CanteenContent";
import {ImageOverlayPaddingStyle} from "../imageOverlays/ImageOverlay";
import {ImageOverlayPosition} from "../imageOverlays/ImageOverlays";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {useAppTranslation} from "../translations/AppTranslation";
import {Tooltip} from "native-base";
import {ColorHelper} from "../../helper/ColorHelper";

interface AppState {
	resource_id: any,
	width?: number,
	position?: ImageOverlayPosition,
}
export const CanteenCardOverlayMoreInformation: FunctionComponent<AppState> = (props) => {

	const resource_id = props?.resource_id;
	const resourceId = resource_id;

	const accessibilityLabel = useAppTranslation("moreInformations");

	const projectColor = ColorHelper.useProjectColor();
	const overlayTextColor = useMyContrastColor(projectColor);

	return(
		<DefaultComponentCardOverlayBox width={props?.width} position={props?.position} >
			<Tooltip label={accessibilityLabel}>
			<TouchableOpacity accessibilityLabel={accessibilityLabel} onPress={() => {
				Navigation.navigateTo(CanteenContent, {id: resourceId, showbackbutton: true})
//				NavigatorHelper.navigateWithoutParams(CanteenContent, false, {id: resourceId, showbackbutton: true})
			}} >
				<InfoIcon color={overlayTextColor} />
			</TouchableOpacity>
			</Tooltip>
		</DefaultComponentCardOverlayBox>
	)

}
