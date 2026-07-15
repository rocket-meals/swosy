import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import translations from './locales/translations.json';
import { LanguageCode } from '@/constants/SettingData';

// Preprocess translations to create a structure compatible with i18next
const formattedTranslations: any = {};
Object.keys(translations).forEach(key => {
	Object.entries(translations[key as keyof typeof translations]).forEach(([lang, value]) => {
		if (!formattedTranslations[lang]) {
			formattedTranslations[lang] = {};
		}
		formattedTranslations[lang][key] = value;
	});
});

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
