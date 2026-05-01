import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@/constants/AsyncStorage';
import translations from './locales/translations.json';

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
	detect: async (callback: any) => {
		try {
			const language = await AsyncStorage.getItem('user-language');
			if (language) {
				callback(language);
			} else {
				callback(Localization.getLocales()[0]?.languageCode ?? 'de'); // Use device language
			}
		} catch (error) {
			console.error('Error detecting language', error);
			callback(Localization.getLocales()[0]?.languageCode ?? 'de');
		}
	},
	init: () => {},
	cacheUserLanguage: async (language: string) => {
		try {
			await AsyncStorage.setItem('user-language', language);
		} catch (error) {
			console.error('Error caching language', error);
		}
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
