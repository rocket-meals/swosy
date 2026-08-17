import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import { toI18nextResources } from 'repo-depkit-common';
import { translationResources } from './locales/translationResources';
import { LanguageCode } from '@/constants/SettingData';

// The catalogue is stored key-first ({ key: { lang: text } }); i18next wants it language-first.
const formattedTranslations = toI18nextResources(translationResources);

// Language detector
const languageDetector = {
	type: 'languageDetector' as const,
	async: true,
	detect: (callback: any) => {
		sqliteKeyValueStorage.getItem('user-language').then((language) => {
			if (language) {
				callback(language);
			} else {
				callback(Localization.getLocales()[0]?.languageCode ?? LanguageCode.DE); // Use device language
			}
		});
	},
	init: () => {},
	cacheUserLanguage: (language: string) => {
		sqliteKeyValueStorage.setItem('user-language', language);
	},
};

i18n
	.use(languageDetector)
	.use(initReactI18next)
	.init({
		resources: formattedTranslations,
		interpolation: {
			escapeValue: false, // React already escapes by default
		},
	});

export default i18n;
