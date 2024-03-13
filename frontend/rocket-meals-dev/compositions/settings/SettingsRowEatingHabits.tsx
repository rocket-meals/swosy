import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {IconNames} from '@/constants/IconNames';
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import {MarkingList} from '@/components/food/MarkingList';

export function useGlobalActionSheetSettingProfileEatingHabits() {

	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const label = translation_title

	const items: MyGlobalActionSheetItem[] = [];

	items.push({
		key: "markingKey",
		label: label,
		//icon: "test",
		accessibilityLabel: translation_title,
		onSelect: undefined,
		render: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
			// Use the custom context provider to provide the input value and setter
			return <MarkingList />
		}
	})

	const config = {
		onCancel: async () => {
			return true;
		},
		visible: true,
		title: translation_title,
		items: items
	}

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const onPress = () => {
		show(config)
	}

	return onPress;
}

export function useEditProfileEatingHabitsAccessibilityLabel(): string {
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const translation_select = useTranslation(TranslationKeys.select)
	return translation_title + ': ' + translation_select;
}

export const SettingsRowProfileEatingHabits: FunctionComponent<AppState> = ({...props}) => {
	const leftIcon = IconNames.eating_habit_icon
	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const label = translation_title

	const accessibilityLabel = useEditProfileEatingHabitsAccessibilityLabel();

	const onPress = useGlobalActionSheetSettingProfileEatingHabits();

	return (
		<>
			<SettingsRow accessibilityLabel={accessibilityLabel} labelLeft={label} leftIcon={leftIcon} {...props} onPress={onPress} />
		</>
	)
}
