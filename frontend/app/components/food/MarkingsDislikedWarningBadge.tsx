import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileMarkingsDict} from "@/states/SynchedProfile";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MarkingListSelective} from "@/components/food/MarkingList";
import {useDislikeColor} from "@/states/ColorScheme";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";

export type MarkingsDislikedWarningBadgeProps = {
	foodoffer: Foodoffers,
	borderRadius?: number,
}
export const MarkingsDislikedWarningBadge = ({foodoffer, borderRadius}: MarkingsDislikedWarningBadgeProps) => {
	const dislikeColor = useDislikeColor();

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const dislikedMarkingIds = MarkingHelper.getDislikedMarkingIds(foodoffer, profilesMarkingsDict)

	const translation_attention = useTranslation(TranslationKeys.attention);
	const translation_eating_habit = useTranslation(TranslationKeys.eating_habits);

	const accessibilityLabelDislike = translation_attention + " "+translation_eating_habit;
	const dislike_icon = IconNames.eating_habit_icon;

	const onPress = () => {
		setModalConfig({
			title: translation_eating_habit,
			accessibilityLabel: accessibilityLabelDislike,
			key: "dislikedMarkingIds",
			label: translation_eating_habit,
			renderAsContentInsteadItems: (key: string, hide: () => void) => {
				return <MarkingListSelective markingIds={dislikedMarkingIds} />
			}
		})
	}

	return 	<>
		<MyButton
			backgroundColor={dislikeColor}
			isActive={true}
			borderRadius={borderRadius}
			onPress={onPress}
			accessibilityLabel={accessibilityLabelDislike} tooltip={accessibilityLabelDislike} icon={dislike_icon} />
	</>
}