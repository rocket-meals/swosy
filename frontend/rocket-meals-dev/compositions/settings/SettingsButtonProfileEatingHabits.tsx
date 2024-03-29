import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {useEditProfileEatingHabitsAccessibilityLabel} from '@/compositions/settings/SettingsRowEatingHabits';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MarkingList} from "@/components/food/MarkingList";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";

export const useShowMyModalMarkingListModal = () => {
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const onPress = () => {
		let item: MyModalActionSheetItem = {
			key: "eating_habits",
			label: translation_title,
			title: translation_title,
			accessibilityLabel: translation_title,
			renderAsContentInsteadItems: () => {
				return <MarkingList />
			}
		}

		setModalConfig(item)
	}

	return onPress;
}

interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();

	const onPress = useShowMyModalMarkingListModal();

	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={onPress} />
		</>
	)
}
