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
import {BUTTON_DEFAULT_BorderRadius, BUTTON_DEFAULT_Padding} from "@/components/buttons/MyButtonCustom";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getMarkingShortCode, getMarkingExternalIdentifier, getMarkingName} from "@/components/food/MarkingListItem";
import DirectusImageOrIconComponent, {
	hasResourceImageOrRemoteImage
} from "@/components/image/DirectusImageOrIconComponent";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
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


export const MarkingIconOrShortCodeWithTextSize = ({markingId, textSize}: {markingId: string, textSize: TextSizeType | undefined}) => {
	const viewBackgroundColor = useViewBackgroundColor()
	const viewContrastColor = useMyContrastColor(viewBackgroundColor)
	const textColor = useTextContrastColor();
	const textContrastColor = useMyContrastColor(textColor);
	const lineHeight = getLineHeightInPixelBySize(textSize || TEXT_SIZE_DEFAULT) || 10;
	const defaultLineHeightNormal = getLineHeightInPixelBySize(TEXT_SIZE_DEFAULT) || 10
	const defaultBorderRadius = BUTTON_DEFAULT_BorderRadius/2;
	const percentageBorderRadiusToHeight = defaultBorderRadius / defaultLineHeightNormal;
	const adaptedBorderRadius = parseInt((percentageBorderRadiusToHeight * lineHeight)+"");


	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const marking: Markings | undefined | null = markingsDict?.[markingId];
	if(!marking){
		return null;
	}
	const alias = getMarkingShortCode(marking);
	const short_code = getMarkingShortCode(marking);
	const hide_border = !!marking?.hide_border;
	const marking_invert_background_color = !!marking.invert_background_color
	const short_code_text_color = marking_invert_background_color ? textContrastColor : textColor;
	
	const hasImageOrIcon = hasResourceImageOrRemoteImage(marking);


	if(!short_code && !hasImageOrIcon){
		return null;
	}

	let content = <View style={{
		flexDirection: "row",
		marginHorizontal: 2,
	}}>
		<Text style={{
			color: short_code_text_color
		}} size={textSize}>
			{short_code}
		</Text>
	</View>

	if(hasImageOrIcon){
		const imageWidthAndHeight = lineHeight
		content = (
			<View style={{
				flexDirection: "row",
			}}>
				<DirectusImageOrIconComponent resource={marking} widthImage={imageWidthAndHeight} heightImage={imageWidthAndHeight} />
			</View>
		)
	}

	const backgroundColor = marking_invert_background_color ? viewContrastColor : undefined;
	const borderColor = hide_border ? "transparent" : viewContrastColor;

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
			<View style={{
				height: lineHeight,
				width: 3
			}} />
		</View>
	)
}


export type MarkingBadgeProps = {
	markingId: string
	borderRadius?: number,
}
export const MarkingBadge = ({markingId, ...props}: MarkingBadgeProps) => {
	const [modalConfig, setModalConfig] = useModalGlobalContext();
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const viewBackgroundColor = useViewBackgroundColor();
	const textColor = useTextContrastColor();

	const widthByCharacters = useCharacterWithInPixel(7);

	const translation_show_more_information = useTranslation(TranslationKeys.show_more_information)

	const foodsAreaColor = useFoodsAreaColor()

	const iconWidth = useIconWithInPixel();

	const borderRadius = props.borderRadius || MyCardDefaultBorderRadius;

	const marking: Markings | undefined | null = markingsDict?.[markingId];

	const translation_description = useTranslation(TranslationKeys.description);
	const translation_eating_habit = useTranslation(TranslationKeys.eating_habits);


	if(!marking){
		return null;
	}

	const hide_border = !!marking?.hide_border;


	const withoutExternalIdentifier = false;
	const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
	const marking_translations = marking?.translations as TranslationEntry[]
	const translated_description = getDirectusTranslation(languageCode, marking_translations, "description");

	const translation_title = translated_name;

	const accessibilityLabel = translation_show_more_information+": "+translated_name

	const onPress = () => {
		setModalConfig({
			title: translation_title,
			accessibilityLabel: translated_name,
			key: "foodGroupBadge",
			label: translation_eating_habit,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return <MyScrollView>
					<View style={{width: "100%", padding: SETTINGS_ROW_DEFAULT_PADDING}}>
						<View style={{width: "100%", alignItems: "center"}}>
							<DirectusImageOrIconComponent resource={marking} widthImage={widthByCharacters} heightImage={widthByCharacters} />
						</View>
						<ThemedMarkdown markdown={translated_description} />
					</View>
				</MyScrollView>
			}
		})
	}

	let hasImage = hasResourceImageOrRemoteImage(marking);

	let customIcon = null;

	let usedIcon = marking.icon

	const defaultPadding = BUTTON_DEFAULT_Padding
	const alias = getMarkingShortCode(marking);
	if(alias){
		let outerPadding = defaultPadding/2;
		let innerPadding = defaultPadding - outerPadding; // maybe by dividing 1/2 the outer padding is 0, so we need to subtract it

		customIcon = <View style={{
			marginVertical: outerPadding,
			marginHorizontal: outerPadding,
		}}>
			<View style={{
				height: iconWidth+innerPadding*2, // we need more space for the text
				width: iconWidth+innerPadding*2, // we need more space for the text
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
			}}>
				<Text numberOfLines={1}>
					{alias}
				</Text>
			</View>
		</View>
	}

	const imageWidthAndHeight = iconWidth+2*defaultPadding
	if(hasImage){
		customIcon = <DirectusImageOrIconComponent resource={marking} widthImage={imageWidthAndHeight} heightImage={imageWidthAndHeight} />
	}

	if(!usedIcon && !customIcon){
		usedIcon = IconNames.identifier;
	}

	let transparentBackgroundColor = "#FFFFFF00";
	let usedBackgroundColor = hasImage ? transparentBackgroundColor : viewBackgroundColor

	return 	<>
		<MyButton
			useTransparentBorderColor={hide_border}
			inactiveBackgroundColor={"transparent"}
			useOnlyNecessarySpace={true}
			borderRadius={borderRadius}
			onPress={onPress}
			accessibilityLabel={accessibilityLabel}
			tooltip={accessibilityLabel}
			icon={usedIcon}
			customIcon={customIcon}
		/>
	</>
}