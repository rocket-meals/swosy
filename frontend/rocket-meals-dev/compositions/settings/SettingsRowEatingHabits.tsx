import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {useSynchedProfileMarkingsDict} from '@/states/SynchedProfile';
import {IconNames} from '@/constants/IconNames';
import {MyGlobalActionSheetItem, useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import {useSynchedMarkingsDict} from '@/states/SynchedMarkings';
import {SettingsRowTriStateLikeDislike} from '@/components/settings/SettingsRowTriStateLikeDislike';

interface AppState {

}

export function useGlobalActionSheetSettingProfileEatingHabits() {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [profilesMarkingsDict, setProfileMarking, removeProfileMarking] = useSynchedProfileMarkingsDict();

	const translation_title = useTranslation(TranslationKeys.eating_habits)
	const label = translation_title

	const items: MyGlobalActionSheetItem[] = [];

	if (markingsDict) {
		const markingKeys = Object.keys(markingsDict);
		for (let i = 0; i < markingKeys.length; i++) {
			const markingKey = markingKeys[i];
			const marking = markingsDict[markingKey];
			const markingFromProfile = profilesMarkingsDict[marking.id]
			const status = markingFromProfile?.dislikes;

			items.push({
				key: 'gridList',
				label: label,
				//icon: "test",
				accessibilityLabel: translation_title,
				onSelect: undefined,
				render: (backgroundColor, backgroundColorOnHover, textColor, lighterOrDarkerTextColor, hide) => {
					// Use the custom context provider to provide the input value and setter

					const onPress = (nextStatus: boolean | undefined) => {
						if (nextStatus===true) {
							setProfileMarking(marking, true)
						} else if (nextStatus===false) {
							setProfileMarking(marking, false)
						} else {
							removeProfileMarking(marking)
						}
					}

					return <SettingsRowTriStateLikeDislike onPress={onPress} accessibilityLabel={marking.alias || marking.id} labelLeft={marking.alias || marking.id} value={status}/>
				}
			})
		}
	}

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
