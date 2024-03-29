import {MyButton} from "@/components/buttons/MyButton";
import React from "react";
import {Foodoffers} from "@/helper/database/databaseTypes/types";
import {useSynchedProfileMarkingsDict} from "@/states/SynchedProfile";
import {MarkingHelper} from "@/helper/food/MarkingHelper";
import {IconNames} from "@/constants/IconNames";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MarkingList, MarkingListSelective} from "@/components/food/MarkingList";
import {useDislikeColor} from "@/states/ColorScheme";
import {MyModal} from "@/components/modal/MyModal";

export type MarkingBadgeProps = {
	foodoffer: Foodoffers,
	borderRadius?: number,
}
export const MarkingBadge = ({foodoffer, borderRadius}: MarkingBadgeProps) => {
	const dislikeColor = useDislikeColor();

	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();

	const dislikedMarkingIds = MarkingHelper.getDislikedMarkingIds(foodoffer, profilesMarkingsDict)

	const translation_attention = useTranslation(TranslationKeys.attention);
	const translation_eating_habit = useTranslation(TranslationKeys.eating_habits);
	const [show, setShow] = React.useState(false);

	const accessibilityLabelDislike = translation_attention + " "+translation_eating_habit;
	const dislike_icon = IconNames.eating_habit_icon;

	return 	<>
		<MyButton
			backgroundColor={dislikeColor}
			isActive={true}
			borderRadius={borderRadius}
			onPress={() => {
				setShow(true)
			}}
			accessibilityLabel={accessibilityLabelDislike} tooltip={accessibilityLabelDislike} icon={dislike_icon} />
		<MyModal title={translation_eating_habit} visible={show} setVisible={setShow} >
			<MarkingListSelective markingIds={dislikedMarkingIds} />
		</MyModal>
	</>
}