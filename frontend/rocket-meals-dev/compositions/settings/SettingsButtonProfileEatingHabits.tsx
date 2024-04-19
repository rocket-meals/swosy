import React, {FunctionComponent} from 'react';


import {IconNames} from '@/constants/IconNames';
import {MyButton} from '@/components/buttons/MyButton';
import {useEditProfileEatingHabitsAccessibilityLabel} from '@/compositions/settings/SettingsRowEatingHabits';
import {router} from "expo-router";

export const useNavigateToEatingHabits = () => {

	const onPress = () => {
			router.push('/(app)/settings/eatinghabits/');
	}

	return onPress;
}

interface AppState {

}
export const SettingsButtonProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();
	const tooltip = useEditProfileEatingHabitsAccessibilityLabel();

	const onPress = useNavigateToEatingHabits();

	return (
		<>
			<MyButton useOnlyNecessarySpace={true} tooltip={tooltip} accessibilityLabel={accessibilityLabel} useTransparentBackgroundColor={true} useTransparentBorderColor={true} leftIcon={IconNames.eating_habit_icon} {...props} onPress={onPress} />
		</>
	)
}
