import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers, Markings} from "@/helper/database/databaseTypes/types";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {Icon, Text, useTextContrastColor, useViewBackgroundColor, View} from "@/components/Themed";
import {
	BUTTON_DEFAULT_Padding,
	getButtonDefaultPadding,
	MyButtonCustomContentPadder
} from "@/components/buttons/MyButtonCustom";
import {useSynchedMarkingsDict} from "@/states/SynchedMarkings";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getMarkingExternalIdentifier, getMarkingName} from "@/components/food/MarkingListItem";
import DirectusImageOrIconComponent, {
	hasResourceImageOrRemoteImage
} from "@/components/image/DirectusImageOrIconComponent";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {SETTINGS_ROW_DEFAULT_PADDING} from "@/components/settings/SettingsRow";
import {getDirectusTranslation, TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";
import {MyCardDefaultBorderRadius} from "@/components/card/MyCard";
import {Image} from "expo-image";
import {useIconWithInPixel} from "@/components/shapes/Rectangle";
import {useFoodsAreaColor} from "@/states/SynchedAppSettings";

export const MarkingBadges = ({foodoffer, color}: {foodoffer: Foodoffers, color: string}) => {
	const markingsIds = MarkingHelper.getFoodOfferMarkingIds(foodoffer);
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();

	let badges: any[] = [];
	for(let markingId of markingsIds){
		const marking: Markings | undefined | null = markingsDict?.[markingId];
		if(!!marking){
			let markingVisible = marking?.show_on_card
			if(markingVisible){
				badges.push(<MarkingBadge markingId={markingId} color={color} />)
			}
		}
	}

	if(badges.length===0){
		return null;
	} else {
		return badges
	}

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

	const foodsAreaColor = useFoodsAreaColor()

	const iconWidth = useIconWithInPixel();

	const borderRadius = props.borderRadius || MyCardDefaultBorderRadius;

	const imageWidth = (BUTTON_DEFAULT_Padding);

	const marking: Markings | undefined | null = markingsDict?.[markingId];

	const translation_description = useTranslation(TranslationKeys.description);
	const translation_eating_habit = useTranslation(TranslationKeys.eating_habits);


	if(!marking){
		return null;
	}


	const withoutExternalIdentifier = false;
	const translated_name = getMarkingName(marking, languageCode, withoutExternalIdentifier);
	const marking_translations = marking?.translations as TranslationEntry[]
	const translated_description = getDirectusTranslation(languageCode, marking_translations, "description");

	const translation_title = translated_name;

	const accessibilityLabel = translated_name

	const onPress = () => {
		setModalConfig({
			title: translation_title,
			accessibilityLabel: translated_name,
			key: "foodGroupBadge",
			label: translation_eating_habit,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return <View style={{width: "100%", padding: SETTINGS_ROW_DEFAULT_PADDING}}>
					<View style={{width: "100%", alignItems: "center"}}>
						<DirectusImageOrIconComponent resource={marking} widthImage={imageWidth} heightImage={imageWidth} />
					</View>
					<ThemedMarkdown markdown={translated_description} />
				</View>
			}
		})
	}

	let hasImage = hasResourceImageOrRemoteImage(marking);

	let customIcon = null;

	let usedIcon = marking.icon
	let markingExternalIdentifier = getMarkingExternalIdentifier(marking);
	if(markingExternalIdentifier){
		const defaultPadding = getButtonDefaultPadding();
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
					{markingExternalIdentifier}
				</Text>
			</View>
		</View>
	}

	if(hasImage){
		customIcon = <MyButtonCustomContentPadder><DirectusImageOrIconComponent resource={marking} widthImage={iconWidth} heightImage={iconWidth} /></MyButtonCustomContentPadder>
	}

	if(!usedIcon && !customIcon){
		usedIcon = IconNames.identifier;
	}

	let transparentBackgroundColor = "#FFFFFF00";
	let usedBackgroundColor = hasImage ? transparentBackgroundColor : viewBackgroundColor

	return 	<>
		<MyButton
			useOnlyNecessarySpace={true}
			borderRadius={borderRadius}
			backgroundColor={foodsAreaColor}
			onPress={onPress}
			accessibilityLabel={accessibilityLabel}
			tooltip={accessibilityLabel}
			icon={usedIcon}
			customIcon={customIcon}
		/>
	</>
}