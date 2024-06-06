import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {IconNames} from '@/constants/IconNames';
import {useNavigateToEatingHabits} from "@/compositions/settings/SettingsButtonProfileEatingHabits";
import {SettingsRowNavigate} from "@/components/settings/SettingsRowNavigate";

export function useEditProfileEatingHabitsAccessibilityLabel(): string {
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const translation_select = useTranslation(TranslationKeys.edit)
	return translation_title + ': ' + translation_select;
}

export const SettingsRowProfileEatingHabits: FunctionComponent = ({...props}) => {
	const leftIcon = IconNames.eating_habit_icon
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const label = translation_title

	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();

	const onPress = useNavigateToEatingHabits();

	return (
		<>
			<SettingsRowNavigate accessibilityLabel={accessibilityLabel} labelLeft={label} leftIcon={leftIcon} {...props} onPress={onPress} />
		</>
	)
}
