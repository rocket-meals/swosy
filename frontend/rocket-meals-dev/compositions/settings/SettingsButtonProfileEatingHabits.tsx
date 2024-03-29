import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {useEditProfileEatingHabitsAccessibilityLabel} from '@/compositions/settings/SettingsRowEatingHabits';
import {MyModal} from "@/components/modal/MyModal";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {MarkingList} from "@/components/food/MarkingList";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";


export type MyMarkingListModalProps = {
	visible: boolean,
	setVisible: React.Dispatch<React.SetStateAction<boolean>>,
}
export const MyMarkingListModal = (props: MyMarkingListModalProps) => {
	const translation_title = useTranslation(TranslationKeys.eating_habits)

	return (
		<>
			<MyModal title={translation_title} {...props} >
				<MarkingList />
			</MyModal>
		</>
	)
}


interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	//const [modalConfig, setModalConfig] = useMyModalActionSheetGlobalConfig();
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const onPress = () => {
		let item: MyModalActionSheetItem = {
			key: "eating_habits",
			title: translation_title,
			accessibilityLabel: translation_title,
			renderAsContentInsteadItems: () => {
				return <MarkingList />
			}
		}

		setModalConfig(item)
	}


	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={onPress} />
		</>
	)
}
