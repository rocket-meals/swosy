/**
 * languageHelper.ts – Language constants for maestro tests.
 *
 * Imports language labels from the app's SettingData and exports them
 * for use in maestro test assertions and interactions.
 * This ensures tests use the same language labels as the actual UI
 * without hardcoding them.
 */

import { languages } from '../../../app/constants/SettingData';

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
 * Export language labels as constants for easy access in tests.
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
