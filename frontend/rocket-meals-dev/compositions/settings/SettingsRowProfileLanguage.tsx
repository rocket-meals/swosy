import React, {FunctionComponent} from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {useSynchedLanguagesDict} from '@/states/SynchedLanguages';
import {
	useGlobalActionSheetSettingProfileLanguage
} from '@/compositions/settings/UseGlobalActionSheetSettingProfileLanguage';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {IconNames} from '@/constants/IconNames';

interface AppState {

}
export const SettingsRowProfileLanguage: FunctionComponent<AppState> = ({...props}) => {
	const colorSchemeIconName = IconNames.translate_icon

	const translation_edit = useTranslation(TranslationKeys.edit)

	const title = useTranslation(TranslationKeys.language)

	const [selectedLanguageKey, setSavedLanguageKey] = useProfileLanguageCode()
	const [languageDict, setLanguageDict] = useSynchedLanguagesDict();
	const usedLanguageDict = languageDict || {}

	let selectedName: string = selectedLanguageKey
	const selectedLanguage = usedLanguageDict[selectedLanguageKey]
	if (selectedLanguage) {
		selectedName = selectedLanguage.name || selectedLanguage.code
	}

	const accessibilityLabel = translation_edit+': '+title + ' ' + selectedName
	const label = title

	const onPress = useGlobalActionSheetSettingProfileLanguage();

	return (
		<>
			<SettingsRow accessibilityLabel={accessibilityLabel} labelRight={selectedName} labelLeft={label} leftIcon={colorSchemeIconName} {...props} onPress={onPress} />
		</>
	)
}
