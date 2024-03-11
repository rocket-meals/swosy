import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {
	useEditProfileEatingHabitsAccessibilityLabel,
	useGlobalActionSheetSettingProfileEatingHabits
} from '@/compositions/settings/SettingsRowEatingHabits';

interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();

	const onPress = useGlobalActionSheetSettingProfileEatingHabits();

	//                <MyButton
	//                     useOnlyNecessarySpace={true} accessibilityLabel={"Canteen"} leftIcon={IconNames.canteen_icon} {...props} onPress={onPress} />

	return (
		<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={onPress} />
	)
}
