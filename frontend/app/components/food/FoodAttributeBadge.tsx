import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers, FoodsAttributesValues, Markings} from "@/helper/database/databaseTypes/types";
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
	hasResourceImageIconOrRemoteImage,
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
import {
	CommonFieldsOfFoodAndFoodoffers, FoodAttributeImageOrIcon, getFoodAttributeFromFoodAttributeValue,
	getFoodAttributeValuesWhereFoodAttributeIsVisible, getSortedListGroupsOfFoodAttributeValues
} from "@/components/food/FoodDataList";
import {useSynchedFoodsAttributesDict} from "@/states/SynchedFoodattributes";
import {useSynchedFoodsAttributesGroupsDict} from "@/states/SynchedFoodattributesGroups";
import {BadgeWrapper, useBadgeWidth} from "@/components/food/MarkingBadge";

export const FoodAttributeBadges = ({foodoffer}: {foodoffer: CommonFieldsOfFoodAndFoodoffers}) => {

	const attribute_values_unfiltered = foodoffer.attribute_values;

	const [foodAttributesDict, setFoodAttributesDict] = useSynchedFoodsAttributesDict();
	const [foodAttributesGroupsDict, setFoodAttributesGroupsDict] = useSynchedFoodsAttributesGroupsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()

	const attribute_values = getFoodAttributeValuesWhereFoodAttributeIsVisible(attribute_values_unfiltered, foodAttributesDict);
	let listOfGroupsOfFoodAttributeValues = getSortedListGroupsOfFoodAttributeValues(attribute_values, foodAttributesDict, foodAttributesGroupsDict);
	let sorted_attribute_values = listOfGroupsOfFoodAttributeValues.flat();

	let badges: any[] = [];
	for(let attribute_value of sorted_attribute_values){
		let food_attribute = getFoodAttributeFromFoodAttributeValue(attribute_value, foodAttributesDict);
		if(!!food_attribute){
			let show_food_attribute_on_card = food_attribute.show_on_card;
			if(show_food_attribute_on_card){
				badges.push(<FoodAttributeBadge food_attribute_id={food_attribute.id} food_attribute_value={attribute_value} />)
			}
		}
	}

	if(badges.length===0){
		return null;
	} else {
		return badges
	}

}

export type FoodAttributeProps = {
	food_attribute_id: string,
	food_attribute_value: FoodsAttributesValues,
	borderRadius?: number,
}
export const FoodAttributeBadge = ({food_attribute_id, food_attribute_value, ...props}: FoodAttributeProps) => {
	const [foodAttributesDict, setFoodAttributesDict] = useSynchedFoodsAttributesDict();
	const badgeWidth = useBadgeWidth();

	const foodAttribute = foodAttributesDict?.[food_attribute_id];
	if(!foodAttribute){
		return null;
	}

	return 	<BadgeWrapper>
		<FoodAttributeImageOrIcon foodAttribute={foodAttribute} width={badgeWidth} height={badgeWidth}/>
	</BadgeWrapper>
}