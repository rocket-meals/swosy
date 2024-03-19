import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileMarkingsDict} from "@/states/SynchedProfile";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MyGlobalActionSheetConfig, useMyGlobalActionSheet} from "@/components/actionsheet/MyGlobalActionSheet";
import {MarkingList, MarkingListSelective} from "@/components/food/MarkingList";
import {useDislikeColor} from "@/states/ColorScheme";

export type MarkingBadgeProps = {
	foodoffer: Foodoffers,
	borderRadius?: number,
}
export const MarkingBadge = ({foodoffer, borderRadius}: MarkingBadgeProps) => {
	const dislikeColor = useDislikeColor();

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const markingsIds = MarkingHelper.getFoodOfferMarkingIds(foodoffer);

	const dislikedMarkingIds = MarkingHelper.getDislikedMarkingIds(foodoffer, profilesMarkingsDict)

	const translation_attention = useTranslation(TranslationKeys.attention);
	const translation_eating_habit = useTranslation(TranslationKeys.eating_habits);
	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const config: MyGlobalActionSheetConfig = {
		visible: true,
		title: translation_eating_habit,
		renderCustomContent: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
			// Use the custom context provider to provide the input value and setter
			return <MarkingListSelective markingIds={dislikedMarkingIds} />
		}
	}

	const accessibilityLabelDislike = translation_attention + " "+translation_eating_habit;
	const dislike_icon = IconNames.eating_habit_icon;

	return 	<MyButton
		backgroundColor={dislikeColor}
		isActive={true}
		borderRadius={borderRadius}
		onPress={() => {
			console.log("-------")
			console.log("MarkingBadge", foodoffer.alias)
			console.log("foodoffer", foodoffer)
			console.log("markingsIds", markingsIds)
			console.log("profilesMarkingsDict", profilesMarkingsDict)
			console.log("dislikedMarkingIds", dislikedMarkingIds)
			show(config)
		}}
		accessibilityLabel={accessibilityLabelDislike} tooltip={accessibilityLabelDislike} icon={dislike_icon} />
}