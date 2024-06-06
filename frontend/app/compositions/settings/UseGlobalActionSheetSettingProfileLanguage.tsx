import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {useSynchedLanguagesDict} from '@/states/SynchedLanguages';
import {Text} from '@/components/Themed';
import CountryFlag from 'react-native-country-flag';
import {useIsDebug} from '@/states/Debug';
import React from "react";
import {MyModalActionSheetItem} from "@/components/modal/MyModalActionSheet";
import {useModalGlobalContext} from "@/components/rootLayout/RootThemeProvider";
import {IconNames} from "@/constants/IconNames";

export const useProfileLanguageModal = () => {
	const translation_select = useTranslation(TranslationKeys.select)
	const [modalConfig, setModalConfig] = useModalGlobalContext();

	const isDebug = useIsDebug()

	const title = useTranslation(TranslationKeys.language)
	const language_system = useTranslation(TranslationKeys.language_system)

	const [selectedLanguageKey, setSavedLanguageKey, rawSelectedLanguageKey] = useProfileLanguageCode()
	const [languageDict, setLanguageDict] = useSynchedLanguagesDict();
	const usedLanguageDict = languageDict || {}
	const selectedKey = rawSelectedLanguageKey

	const availableOptionKeys = Object.keys(usedLanguageDict)

	const items: MyModalActionSheetItem[] = []

	items.push({
		key: "system",
		label: language_system,
		active: selectedKey === undefined,
		accessibilityLabel: language_system+' '+translation_select,
		iconLeft: IconNames.settings_system_auto_icon,
		onSelect: async (code: string, hide: () => void) => {
			console.log('Selected language: system')
			setSavedLanguageKey(undefined);
			hide()
		}
	})


	for (const key of availableOptionKeys) {
		const language = usedLanguageDict[key]
		const code = language?.code

		const active = code === selectedKey

		const label = language?.name || code

		// code is in form of "de-DE" so we need to extract the iso code which is the second part "DE"
		const isoCode = code?.split('-')[1]

		const itemAccessibilityLabel = label+' '+translation_select

		items.push({
			key: code as string,
			label: label,
			active: active,
			accessibilityLabel: itemAccessibilityLabel,
			iconLeftCustomRender: (key: string, hide: () => void) => {
				const renderedContent = [];
				renderedContent.push(
					<CountryFlag isoCode={isoCode} size={22} />
				)
				if (isDebug) {
					renderedContent.push(
						<Text>{code}</Text>
					)
				}
				return renderedContent
			},
			onSelect: async (code: string, hide: () => void) => {
				console.log('Selected language: '+code)
				setSavedLanguageKey(code)
				hide()
			}
		})
	}

	const onPress = () => {
		setModalConfig({
			key: "profile_language",
			label: title,
			title: title,
			accessibilityLabel: title,
			items: items

		})
	}

	return onPress
}