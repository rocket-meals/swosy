/**
 * LanguageHelper.ts – Exports language labels from SettingData.
 *
 * Provides a centralized way to access language labels defined in the app's
 * SettingData.ts, making them available to both the app and maestro tests.
 */

import { languages } from '../constants/SettingData';

/**
 * Get the language label for a given language code.
 * Examples:
 *   getLanguageLabel('en') → 'English (English)'
 *   getLanguageLabel('de') → 'German (Deutsch)'
 */
export function getLanguageLabel(languageCode: string): string {
	const language = languages.find((lang) => lang.value === languageCode);
	if (!language) {
		throw new Error(`Language not found for code: ${languageCode}`);
	}
	return language.label;
}

/**
 * Export language labels as constants for easy access.
 */
export const LanguageLabels = {
	ENGLISH: getLanguageLabel('en'),
	GERMAN: getLanguageLabel('de'),
	TURKISH: getLanguageLabel('tr'),
	SPANISH: getLanguageLabel('es'),
	FRENCH: getLanguageLabel('fr'),
	CHINESE: getLanguageLabel('zh'),
	ARABIC: getLanguageLabel('ar'),
	RUSSIAN: getLanguageLabel('ru'),
};
