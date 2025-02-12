import {
	Icon,
	View,
	Text,
	IconFamily,
	IconParseDirectusStringToIconAndFamily,
	TEXT_SIZE_DEFAULT, TextSizeType
} from '@/components/Themed';
import React from 'react';
import DirectusImage from "@/components/project/DirectusImage";
import {StringHelper} from "@/helper/string/StringHelper";
import {MyScrollView} from "@/components/scrollview/MyScrollView";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {MarkingIconOrShortCodeWithTextSize} from "@/components/food/MarkingBadge";
import {MyButton} from "@/components/buttons/MyButton";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";

export function hasResourceImageOrRemoteImage(resource: any){
	return resource.image || resource.image_remote_url;
}

export function hasResourceImageIconOrRemoteImage(resource: any){
	return hasResourceImageOrRemoteImage(resource) || resource.icon;
}

export type DirectusImageOrIconWithModalComponentProps = {
	title: string,
	accessibilityLabel: string,
	label: string,
	tooltip?: string,
	key: string,
	backgroundColor?: string,
	contrastBorderColorWhenInactive?: boolean,
	renderAsContentInsteadItems?: (key: string, hide: () => void, backgroundColor: string | undefined | null) => React.ReactNode,
} & DirectusImageOrIconComponentProps

export function DirectusImageOrIconWithModalComponent({ title, contrastBorderColorWhenInactive, backgroundColor, accessibilityLabel, tooltip, label, renderAsContentInsteadItems, ...props }: DirectusImageOrIconWithModalComponentProps) {
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	let onPress: undefined | (() => void) = () => {
		setModalConfig({
			title: title,
			accessibilityLabel: accessibilityLabel,
			key: props.key,
			label: label,
			renderAsContentInsteadItems: renderAsContentInsteadItems
		})
	}
	if(!renderAsContentInsteadItems){
		onPress = undefined;
	}

	return <DirectusImageOrIconWithButtonComponent backgroundColor={backgroundColor} tooltip={tooltip} onPress={onPress} accessibilityLabel={accessibilityLabel} {...props} />
}

export type DirectusImageOrIconWithButtonComponentProps = {
	onPress?: () => void,
	accessibilityLabel: string,
	tooltip?: string,
	short?: string,
	backgroundColor?: string
} & DirectusImageOrIconComponentProps

export function DirectusImageOrIconWithButtonComponent({ onPress, tooltip, accessibilityLabel, backgroundColor, ...props }: DirectusImageOrIconWithButtonComponentProps) {
	return <MyButton inactiveBackgroundColor={backgroundColor} tooltip={tooltip} useTransparentBorderColor={true} accessibilityLabel={accessibilityLabel} onPress={onPress} customIcon={
		<View style={{
			width: props.widthImage, height: props.heightImage, justifyContent: 'center', alignItems: 'center', backgroundColor: "transparent"
		}}>
			<DirectusImageOrIconComponent {...props} />
		</View>
	} />
}

export type DirectusImageOrIconComponentProps = {
	resource: any,
	iconFamily?: IconFamily,
	widthImage?: number,
	heightImage?: number,
	short?: string | null,
	iconColor?: string,
	textColor?: string
	textSize?: TextSizeType,
	iconSize?: number
}

export default function DirectusImageOrIconComponent({ resource, iconFamily, iconSize, widthImage, heightImage, iconColor, short, textColor, textSize }: DirectusImageOrIconComponentProps) {
	let iconLeft = resource.icon_expo || resource.icon
	const alias = resource.alias
	let iconLeftCustom = undefined

	let usedTextColor = textColor;

	let shortContent = <View style={{
		flexDirection: "row",
		marginHorizontal: 2,
	}}>
		<Text style={{
			color: usedTextColor
		}} size={textSize}>
			{short}
		</Text>
	</View>
	iconLeftCustom = shortContent;


	if(iconLeft){
		if(!iconFamily){ // a directus Icon
			let {
				family, icon
			} = IconParseDirectusStringToIconAndFamily(iconLeft)
			iconLeftCustom = <Icon accessibilityLabel={alias} name={icon} size={iconSize} family={family} color={iconColor} />
		} else {
			iconLeftCustom = <Icon accessibilityLabel={alias} size={iconSize} name={iconLeft} color={iconColor} />
		}
	}




	if(hasResourceImageOrRemoteImage(resource)){
		let height = heightImage || 20;
		let width = widthImage || height

		iconLeftCustom = <View style={{
			width: width, height: height, justifyContent: 'center', alignItems: 'center', borderRadius: 3
		}}>
			<View style={{
				position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: height, width: width
			}}>
				<DirectusImage alt={alias} image_url={resource.image_remote_url} assetId={resource.image} thumbHash={resource.image_thumb_hash} style={{width: "100%", height: "100%"}} />
			</View>
		</View>
	}
	return iconLeftCustom
}