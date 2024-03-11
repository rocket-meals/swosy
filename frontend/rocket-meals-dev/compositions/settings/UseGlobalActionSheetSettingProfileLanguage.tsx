import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {useProfileLanguageCode} from '@/states/SynchedProfile';
import {useSynchedLanguagesDict} from '@/states/SynchedLanguages';
import {useMyGlobalActionSheet} from '@/components/actionsheet/MyGlobalActionSheet';
import {Text} from '@/components/Themed';
import CountryFlag from 'react-native-country-flag';
import {useIsDebug} from '@/states/Debug';

export function useGlobalActionSheetSettingProfileLanguage() {
	const translation_select = useTranslation(TranslationKeys.select)

	const isDebug = useIsDebug()

	const title = useTranslation(TranslationKeys.language)

	const [selectedLanguageKey, setSavedLanguageKey] = useProfileLanguageCode()
	const [languageDict, setLanguageDict] = useSynchedLanguagesDict();
	const usedLanguageDict = languageDict || {}
	const selectedKey = selectedLanguageKey

	const availableOptionKeys = Object.keys(usedLanguageDict)

	const items = []
	for (const key of availableOptionKeys) {
		const language = usedLanguageDict[key]
		const code = language?.code

		const icon = 'translation'
		const active = code === selectedKey

		const label = language?.name || code

		// code is in form of "de-DE" so we need to extract the iso code which is the second part "DE"
		const isoCode = code?.split('-')[1]

		const itemAccessibilityLabel = label+' '+translation_select

		items.push({
			key: code as string,
			label: label,
			icon: icon,
			active: active,
			accessibilityLabel: itemAccessibilityLabel,
			renderLeftIcon: (backgroundColor: string, backgroundColorOnHover: string, textColor: string, lighterOrDarkerTextColor: string, hide: () => void) => {
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
				setSavedLanguageKey(code)
				hide();
			}
		})
	}

	const config = {
		onCancel: undefined,
		visible: true,
		title: title,
		items: items
	}

	const [show, hide, showActionsheetConfig] = useMyGlobalActionSheet()

	const onPress = () => {
		show(config)
	}

	return onPress;
}