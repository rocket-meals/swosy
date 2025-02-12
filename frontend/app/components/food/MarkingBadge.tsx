import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {
	getLineHeightInPixelBySize,
	Text,
	TEXT_SIZE_DEFAULT,
	TextSizeType,
	useTextContrastColor,
	useViewBackgroundColor,
	View
} from "@/components/Themed";
import {
	BUTTON_DEFAULT_BorderRadius,
	BUTTON_DEFAULT_BorderWidth,
	BUTTON_DEFAULT_Padding
} from "@/components/buttons/MyButtonCustom";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getMarkingShortCode, getMarkingExternalIdentifier, getMarkingName} from "@/components/food/MarkingListItem";
import DirectusImageOrIconComponent, {
	DirectusImageOrIconWithModalComponent,
	hasResourceImageIconOrRemoteImage,
	hasResourceImageOrRemoteImage
} from "@/components/image/DirectusImageOrIconComponent";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {
	getDirectusTranslation,
	hasDirectusTranslation,
	TranslationEntry
} from "@/helper/translations/DirectusTranslationUseFunction";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {useCharacterWithInPixel, useIconWithInPixel} from "@/components/shapes/Rectangle";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {MyScrollView} from "@/components/scrollview/MyScrollView";

export const MarkingBadges = ({foodoffer}: {foodoffer: Foodoffers}) => {
	const markingsIds = MarkingHelper.getFoodOfferMarkingIds(foodoffer);
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	let badges: any[] = [];
	for(let markingId of markingsIds){
		const marking: Markings | undefined | null = markingsDict?.[markingId];
		if(!!marking){
			let markingVisible = marking?.show_on_card
			if(markingVisible){
				badges.push(<MarkingBadge markingId={markingId} />)
			}
		}
	}

	if(badges.length===0){
		return null;
	} else {
		return badges
	}

}


export const MarkingIconOrShortCodeWithTextSize = ({markingId, textSize, imageSize, hide_border, ignoreSpacer}: {ignoreSpacer?: boolean, hide_border?: boolean, markingId: string, textSize: TextSizeType | undefined, imageSize?: number}) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const viewBackgroundContrastColor = useMyContrastColor(viewBackgroundColor)
	const viewWhiteOrBlackBackgroundColor = useMyContrastColor(viewBackgroundContrastColor)

	const lineHeight = imageSize || getLineHeightInPixelBySize(textSize || TEXT_SIZE_DEFAULT) || 10;
	const defaultLineHeightNormal = getLineHeightInPixelBySize(TEXT_SIZE_DEFAULT) || 10
	const defaultBorderRadius = BUTTON_DEFAULT_BorderRadius/2;
	const percentageBorderRadiusToHeight = defaultBorderRadius / defaultLineHeightNormal;
	const adaptedBorderRadius = parseInt((percentageBorderRadiusToHeight * lineHeight)+"");


	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined | null = markingsDict?.[markingId];
	if(!marking){
		return null;
	}

	const hasImageOrRemoteImage = hasResourceImageOrRemoteImage(marking);
	const hasImageIconOrRemoteImage = hasResourceImageIconOrRemoteImage(marking);

	const alias = getMarkingShortCode(marking);
	const short_code = getMarkingShortCode(marking);
	const hide_border_used = hide_border || !!marking?.hide_border

	const marking_backgroundcolor = marking?.background_color;
	const marking_invert_background_color = !!marking.invert_background_color
	let backgroundColor = marking_backgroundcolor
	if(!backgroundColor && !hasImageOrRemoteImage){
		backgroundColor = viewWhiteOrBlackBackgroundColor;
	}
	const invertedBackgroundColor = useMyContrastColor(backgroundColor);
	if(marking_invert_background_color){
		backgroundColor = invertedBackgroundColor;
	}


	//const short_code_text_color = marking_invert_background_color ? textContrastColor : textColor;
	const textColor = useMyContrastColor(backgroundColor);

	if(!short_code && !hasImageOrRemoteImage){
		return null;
	}

	let content = <View style={{
		flexDirection: "row",
		marginHorizontal: 2,
		backgroundColor: backgroundColor
	}}>
		<Text style={{
			color: textColor
		}} size={textSize}>
			{short_code}
		</Text>
	</View>

	if(hasImageIconOrRemoteImage){
		const imageWidthAndHeight = imageSize || lineHeight

		content = (
			<View style={{
				flexDirection: "row",
			}}>
				<DirectusImageOrIconComponent resource={marking} widthImage={imageWidthAndHeight} heightImage={imageWidthAndHeight} iconColor={textColor} />

			</View>
		)
	}
	
	const borderColor = hide_border_used ? "transparent" : viewBackgroundContrastColor;

	return (
		<View style={{
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "flex-start",
			flexShrink: 1,
			paddingHorizontal: 2,
			paddingVertical: 2,
		}}>
			<View style={{
				backgroundColor: backgroundColor,
				borderColor: borderColor,
				borderWidth: 1,
				borderRadius: adaptedBorderRadius,
				overflow: "hidden",
				flexShrink: 1,
			}}>
				{content}
			</View>
			{ignoreSpacer &&
				<View style={{
					height: lineHeight,
					width: 3
				}} />
			}
		</View>
	)
}

export const useBadgeWidth = () => {
	const iconWidth = useIconWithInPixel();
	const defaultPadding = BUTTON_DEFAULT_Padding
	const imageWidthAndHeight = iconWidth+2*defaultPadding-2*BUTTON_DEFAULT_BorderWidth
	return imageWidthAndHeight;
}

export const BadgeWrapper = ({children}: {children: any}) => {
	const iconWidth = useIconWithInPixel();
	const defaultPadding = BUTTON_DEFAULT_Padding
	const imageWidthAndHeight = iconWidth+2*defaultPadding

	return <View style={{
		width: imageWidthAndHeight,
		height: imageWidthAndHeight,
		justifyContent: "center",
		alignItems: "center",
	}}>
		{children}
	</View>
}

export type MarkingIconClickableProps = {
	markingId: string
	borderRadius?: number,
	width?: number,
	height?: number
	textSize?: TextSizeType
	imageHeightInTextSize?: TextSizeType
}
export const MarkingIconClickable = ({markingId, width, height, imageHeightInTextSize, textSize, ...props}: MarkingIconClickableProps) => {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const lineHeight = height || getLineHeightInPixelBySize(imageHeightInTextSize || textSize || TEXT_SIZE_DEFAULT) || 10;
	height = lineHeight;
	const badgeWidth = useBadgeWidth();
	const viewBackgroundColor = useViewBackgroundColor()
	const viewBackgroundContrastColor = useMyContrastColor(viewBackgroundColor)
	const viewWhiteOrBlackBackgroundColor = useMyContrastColor(viewBackgroundContrastColor)

	const marking: Markings | undefined | null = markingsDict?.[markingId];

	const widthByCharacters = useCharacterWithInPixel(7);

	const translation_show_more_information = useTranslation(TranslationKeys.show_more_information)


	const backgroundcolor = marking?.background_color || "#FFFFFF00"

	let backgroundColor = backgroundcolor
	const textColor = useMyContrastColor(backgroundColor);

	const hasImageOrRemoteImage = hasResourceImageOrRemoteImage(marking);

	if(!backgroundColor && !hasImageOrRemoteImage){
		backgroundColor = viewWhiteOrBlackBackgroundColor;
	}

	let translationsFoodAttribute = marking?.translations as TranslationEntry[];
	const hasTranslation = hasDirectusTranslation(languageCode, translationsFoodAttribute, "description");

	if(!marking){
		return null;
	}

	const withoutExternalIdentifier = false;
	const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
	let label = translated_name;
	let title = translated_name;
	const marking_translations = marking?.translations as TranslationEntry[]
	const translated_description = getDirectusTranslation(languageCode, marking_translations, "description");

	const accessibilityLabel = translation_show_more_information+": "+translated_name

	let renderAsContentInsteadItems: ((key: string, hide: () => void, backgroundColor: string) => Element) | undefined = undefined;
	if(hasTranslation) {
		// @ts-ignore
		renderAsContentInsteadItems = (key, hide, backgroundColor) => {
			return <MyScrollView>
				<View style={{width: "100%", padding: SETTINGS_ROW_DEFAULT_PADDING}}>
					<View style={{width: "100%", alignItems: "center"}}>
						<View style={{
							//backgroundColor: "red"
						}}>
							<MarkingIconOrShortCodeWithTextSize ignoreSpacer={true} markingId={markingId} textSize={TEXT_SIZE_DEFAULT} imageSize={widthByCharacters} />
						</View>
					</View>
					<ThemedMarkdown markdown={translated_description} />
				</View>
			</MyScrollView>
		}
	}

	return <DirectusImageOrIconWithModalComponent
			title={title}
			backgroundColor={backgroundColor}
			tooltip={title}
			accessibilityLabel={accessibilityLabel}
			label={label}
			key={marking.id}
			textColor={textColor}
			textSize={textSize}
			short={marking.short_code}
			renderAsContentInsteadItems={renderAsContentInsteadItems}
			resource={marking} widthImage={width} heightImage={height} iconColor={textColor} />
}


export type MarkingBadgeProps = {
	markingId: string
	borderRadius?: number,
}
export const MarkingBadge = ({markingId, ...props}: MarkingBadgeProps) => {
	const badgeWidth = useBadgeWidth();
	let width = badgeWidth
	let height = width;

	return <BadgeWrapper>
		<MarkingIconClickable markingId={markingId} textSize={undefined} height={height} width={width} />
	</BadgeWrapper>
}