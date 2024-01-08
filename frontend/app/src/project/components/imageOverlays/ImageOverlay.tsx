import React, {FunctionComponent} from "react";
import {Icon, MyActionsheet, useMyContrastColor} from "../../../kitcheningredients";
import {useSynchedImageOverlays} from "../../helper/synchedJSONState";
import {MaterialIcons} from "@expo/vector-icons";
import {TouchableOpacityIgnoreChildEvents} from "../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {View, Text, Tooltip} from "native-base";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {DefaultComponentCardOverlayBox} from "../detailsComponent/DefaultComponentCardOverlayBox";
import {ImageOverlayPosition} from "./ImageOverlays";
import {DirectusTranslatedMarkdown} from "../translations/DirectusTranslatedMarkdown";
import {TouchableOpacity} from "react-native";

export const IMAGE_OVERLAY_ID_FIELD = "image_overlay_id";
export const IMAGE_OVERLAY_CUSTOM_POSITION_FIELD = "position";
interface AppState {
	[IMAGE_OVERLAY_ID_FIELD]?: string,
	width?: number,
	additionalContent?: any,
	position?: ImageOverlayPosition,
	params?: any
	accessibilityLabel?: any
	backgroundColor?: string,
	textColor?: string
}

export const ImageOverlayPaddingStyle = {padding: 5}

export const ImageOverlay: FunctionComponent<AppState> = (props) => {

	const width = props?.width;

	const actionsheet = MyActionsheet.useActionsheet();

	const resource_id = props?.[IMAGE_OVERLAY_ID_FIELD];
	const resource = useSynchedImageOverlays(resource_id);

	const imageOverlay = resource;

	const directusIconName = imageOverlay?.icon;
	const backgroundColor = props?.backgroundColor || imageOverlay?.color;
	const position = props?.position || imageOverlay?.position;

	let textColor = props?.textColor;
	const contrastTextColor = useMyContrastColor(backgroundColor);
	textColor = textColor || contrastTextColor;

	const translations = imageOverlay?.translations || {};
	let title = useDirectusTranslation(translations, "title", undefined, undefined, props?.params);
	if(props?.accessibilityLabel){
		title = props.accessibilityLabel;
	}

	function renderDirectusIcon(){
		let iconName = directusIconName || "help";
		iconName = iconName.replace(/_/g, "-");
		return <Icon color={textColor} name={iconName} as={MaterialIcons} />
	}

	function onAccept(){
		// do nothing
	}

	const renderedAdditionalContent = props?.additionalContent;
	const spacer = !!renderedAdditionalContent ? <View style={{width: 10}} /> : null;

	return (
		<Tooltip label={title} >
			<TouchableOpacity
				accessibilityLabel={title}
				onPress={() => {
					actionsheet.show({
						title: title,
						renderCustomContent: (onClose) => {
							return <View>
								<DirectusTranslatedMarkdown item={imageOverlay} field={"description"} fallback_text={""} />
							</View>
						}
					});
				}}
			>
				<DefaultComponentCardOverlayBox backgroundColor={backgroundColor} width={width} position={position}>
					{renderDirectusIcon()}
					{spacer}
					{renderedAdditionalContent}
				</DefaultComponentCardOverlayBox>
			</TouchableOpacity>
		</Tooltip>
	)


}
