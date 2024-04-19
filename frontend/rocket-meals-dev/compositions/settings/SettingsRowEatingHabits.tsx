import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {IconNames} from '@/constants/IconNames';
import {useNavigateToEatingHabits} from "@/compositions/settings/SettingsButtonProfileEatingHabits";

export function useEditProfileEatingHabitsAccessibilityLabel(): string {
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const translation_select = useTranslation(TranslationKeys.select)
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
			<SettingsRow accessibilityLabel={accessibilityLabel} labelLeft={label} leftIcon={leftIcon} {...props} onPress={onPress} />
		</>
	)
}
