import React, {FunctionComponent} from "react";
import {Icon, MyActionsheet} from "../../../kitcheningredients";
import {useSynchedImageOverlays} from "../../helper/synchedJSONState";
import {MaterialIcons} from "@expo/vector-icons";
import {TouchableOpacityIgnoreChildEvents} from "../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {View, Text, Tooltip} from "native-base";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {ImageOverlayPosition} from "./ImageOverlays";
import {DirectusTranslatedMarkdown} from "../translations/DirectusTranslatedMarkdown";

export const IMAGE_OVERLAY_ID_FIELD = "image_overlay_id";
export const IMAGE_OVERLAY_CUSTOM_POSITION_FIELD = "position";
interface AppState {
	width?: number,
	position?: ImageOverlayPosition,
	accessibilityLabel?: string,
}

export const ImageOverlayPaddingStyle = {padding: 5}

export const ImageOverlayCustom: FunctionComponent<AppState> = (props) => {

	const accessibilityLabel = props?.accessibilityLabel;
	const tooltip = accessibilityLabel;

	const width = props?.width;

	const resource_id = props?.[IMAGE_OVERLAY_ID_FIELD];
	const resource = useSynchedImageOverlays(resource_id);

	const imageOverlay = resource;

	const position = props?.position || imageOverlay?.position;

	function wrapInTooltip(content){
		if(!tooltip){
			return content;
		}
		return (
			<Tooltip label={tooltip}>
				{content}
			</Tooltip>
		)
	}

	return (
		wrapInTooltip(
			<View accessibilityLabel={accessibilityLabel}>
				<DefaultComponentCardOverlayBox width={width} position={position}>
					{props.children}
				</DefaultComponentCardOverlayBox>
			</View>
		)
	)


}
