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
		const availableCodes = languages.map((l) => l.value).join(', ');
		throw new Error(
			`Language not found for code: ${languageCode}. Available codes: ${availableCodes}`,
		);
	}
	return language.label;
}

/**
 * Export language labels as constants for easy access.
 * Note: SettingData.languages must be imported successfully before this constant
 * is evaluated. Since SettingData is a static constant array that doesn't depend
 * on any initialization logic, this is safe to initialize at module load time.
 * 
 * The fail-fast initialization is intentional: if any language is missing from
 * SettingData, the error will be caught immediately at application startup rather
 * than at runtime when a language label is accessed.
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
