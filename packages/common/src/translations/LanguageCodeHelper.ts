/**
 * LanguageCodeHelper.ts – the full language codes (`"de-DE"`) the apps store and send to the server.
 *
 * Two kinds of language codes are in use and must not be confused:
 *
 * - The **translation language** (`"de"`, see {@link TranslationLanguage}) keys the shipped text
 *   catalogue. It is only what `translate()` looks texts up with.
 * - The **language code** (`"de-DE"`) is the primary key of the Directus `languages` collection.
 *   `profiles.language` points to it, the `*_translations` rows are keyed by it, and the backend
 *   resolves a user's language from it (`BackendLanguageResolver`). The apps store this one too,
 *   so app, profile and backend all speak about the same value.
 *
 * `languages.code` is maintained by each customer, so the codes here are only defaults: a value
 * that goes to the server is matched against the customer's table first
 * ({@link findMatchingLanguageCode}).
 */

import { getBaseLanguageCode, isSameBaseLanguage, isSameLanguageCode, normalizeTranslationLanguage, TranslationLanguage } from './TranslationLanguage';

/**
 * The language code each translation language is stored as when nothing better is known.
 * These are the codes the `languages` collection of the customers ships with.
 */
export const DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE: Readonly<Record<TranslationLanguage, string>> = {
	[TranslationLanguage.DE]: 'de-DE',
	[TranslationLanguage.EN]: 'en-US',
	[TranslationLanguage.AR]: 'ar-SA',
	[TranslationLanguage.ES]: 'es-ES',
	[TranslationLanguage.FR]: 'fr-FR',
	[TranslationLanguage.RU]: 'ru-RU',
	[TranslationLanguage.TR]: 'tr-TR',
	[TranslationLanguage.ZH]: 'zh-CN',
};

/** The language code for German, the default language of the apps and the backend. */
export const DEFAULT_LANGUAGE_CODE: string = DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE[TranslationLanguage.DE];

/** Whether `code` names a region as well (`"de-DE"`, `"de_AT"`), not only a language (`"de"`). */
export function hasRegionCode(code: string | null | undefined): boolean {
	if (!code) {
		return false;
	}
	const trimmed = code.trim();
	const separatorIndex = trimmed.search(/[-_]/);
	return separatorIndex > 0 && separatorIndex < trimmed.length - 1;
}

/**
 * Turns a language into a full language code: `"de"` -> `"de-DE"`, `"DE"` -> `"de-DE"`.
 *
 * A code that already has a region is kept as it is, only `"_"` becomes `"-"` (`"de_AT"` ->
 * `"de-AT"`), because the region is a choice (a customer may maintain `"de-AT"`). A short code the
 * apps ship no texts for has no known region and gives `undefined`.
 */
export function toFullLanguageCode(code: string | null | undefined): string | undefined {
	if (!code) {
		return undefined;
	}
	const trimmed = code.trim();
	if (hasRegionCode(trimmed)) {
		const separatorIndex = trimmed.search(/[-_]/);
		return `${trimmed.slice(0, separatorIndex)}-${trimmed.slice(separatorIndex + 1)}`;
	}
	const translationLanguage = normalizeTranslationLanguage(trimmed);
	return translationLanguage ? DEFAULT_LANGUAGE_CODE_BY_TRANSLATION_LANGUAGE[translationLanguage] : undefined;
}

/**
 * The code of a `languages` relation. `profiles.language` arrives as the raw key (`"de-DE"`) or as
 * the expanded row (`{ code: "de-DE" }`), depending on whether the caller fetched the relation.
 */
export function getLanguageCodeFromRelation(language: string | { code?: string | null } | null | undefined): string | undefined {
	const code = typeof language === 'string' ? language : language?.code;
	return code && code.trim().length > 0 ? code.trim() : undefined;
}

/**
 * The code from `availableCodes` that means the same language as `requestedCode`, or `undefined`.
 *
 * The exact code wins (ignoring case, nothing keeps a hand-maintained `languages.code` from being
 * `"DE-de"`), then the same language in any region: the user chose `"de-DE"`, the table has `"de-AT"`.
 * Without a match there is no fallback here, see {@link findBestMatchingLanguageCode} for that.
 */
export function findMatchingLanguageCode(requestedCode: string | null | undefined, availableCodes: readonly string[]): string | undefined {
	if (!requestedCode || !getBaseLanguageCode(requestedCode)) {
		return undefined;
	}
	return availableCodes.find(code => isSameLanguageCode(code, requestedCode)) ?? availableCodes.find(code => isSameBaseLanguage(code, requestedCode));
}

/**
 * Like {@link findMatchingLanguageCode}, but always picks something from a non-empty table: without a
 * match it tries the `fallbackLanguages` in order (German, then English by default), then the first row.
 * `undefined` only for an empty table.
 */
export function findBestMatchingLanguageCode(
	requestedCode: string | null | undefined,
	availableCodes: readonly string[],
	fallbackLanguages: readonly string[] = [TranslationLanguage.DE, TranslationLanguage.EN]
): string | undefined {
	if (availableCodes.length === 0) {
		return undefined;
	}
	const match = findMatchingLanguageCode(requestedCode, availableCodes);
	if (match) {
		return match;
	}
	for (const fallbackLanguage of fallbackLanguages) {
		const fallbackMatch = availableCodes.find(code => isSameBaseLanguage(code, fallbackLanguage));
		if (fallbackMatch) {
			return fallbackMatch;
		}
	}
	return availableCodes[0];
}
